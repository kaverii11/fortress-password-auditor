import { useState, useEffect, useRef } from 'react';
import { analyzePassword, checkPwned } from './utils/PasswordLogic';
import { wordList } from './utils/words';
import { randomInt, pick } from './utils/secureRandom';
import { newSalt, deriveKey, encryptVault, unlockVault, WrongPasswordError } from './utils/vaultCrypto';
import { FaShieldAlt, FaExclamationTriangle, FaCheckCircle, FaEye, FaEyeSlash, FaDice, FaCopy, FaSave, FaTrash, FaHdd, FaGithub, FaLinkedin, FaInfoCircle, FaLock, FaUnlock, FaSearch } from 'react-icons/fa';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import './index.css';

const VAULT_STORAGE_KEY = 'fortressVaultEnc';
const LEGACY_STORAGE_KEY = 'fortressVault'; // old plaintext format, migrated on unlock

const XKCD_WORDS = 4;
const RANDOM_LENGTH = 16;
const RANDOM_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
const XKCD_BITS = XKCD_WORDS * Math.log2(wordList.length) + Math.log2(900);
const RANDOM_BITS = RANDOM_LENGTH * Math.log2(RANDOM_CHARS.length);

function App() {
  const [activeTab, setActiveTab] = useState('auditor'); 
  
  // --- VAULT STATE ---
  // The vault lives in localStorage only as AES-GCM ciphertext (see utils/vaultCrypto.js).
  // The derived key and the decrypted items exist only in memory while unlocked.
  const [vault, setVault] = useState([]);
  const [vaultKey, setVaultKey] = useState(null);      // CryptoKey (non-extractable), null = locked
  const [vaultSalt, setVaultSalt] = useState(null);
  const [hasVault, setHasVault] = useState(() => localStorage.getItem(VAULT_STORAGE_KEY) !== null);
  const [masterInput, setMasterInput] = useState('');
  const [masterConfirm, setMasterConfirm] = useState('');
  const [vaultError, setVaultError] = useState('');
  const [vaultBusy, setVaultBusy] = useState(false);
  const skipNextSave = useRef(true);

  // --- AUDITOR STATE ---
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [stats, setStats] = useState(null);
  const [pwnedCount, setPwnedCount] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // --- HISTORY STATE ---
  const [history, setHistory] = useState([]);

  // --- GENERATOR STATE ---
  const [genPassword, setGenPassword] = useState('');
  const [genType, setGenType] = useState('xkcd');
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState(null);
  const notify = (text, tone = 'ok') => {
    setToast({ text, tone });
    setTimeout(() => setToast(null), 2200);
  };

  // --- PERSIST VAULT (encrypted, only while unlocked) ---
  useEffect(() => {
    if (!vaultKey || !vaultSalt) return;
    if (skipNextSave.current) { skipNextSave.current = false; return; }
    let cancelled = false;
    encryptVault(vault, vaultKey, vaultSalt).then((record) => {
      if (!cancelled) localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(record));
    });
    return () => { cancelled = true; };
  }, [vault, vaultKey, vaultSalt]);

  // Old versions kept the vault as plain JSON; fold it into the encrypted vault, then delete it.
  const takeLegacyItems = () => {
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!legacy) return [];
    try { return JSON.parse(legacy) || []; } catch { return []; }
  };

  const createVault = async () => {
    setVaultError('');
    if (masterInput.length < 10) { setVaultError('Use at least 10 characters for the master password.'); return; }
    if (masterInput !== masterConfirm) { setVaultError('Passwords do not match.'); return; }
    setVaultBusy(true);
    const salt = newSalt();
    const key = await deriveKey(masterInput, salt);
    const items = takeLegacyItems();
    localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(await encryptVault(items, key, salt)));
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    skipNextSave.current = true;
    setVault(items); setVaultSalt(salt); setVaultKey(key); setHasVault(true);
    setMasterInput(''); setMasterConfirm(''); setVaultBusy(false);
  };

  const openVault = async () => {
    setVaultError('');
    setVaultBusy(true);
    try {
      const record = JSON.parse(localStorage.getItem(VAULT_STORAGE_KEY));
      const { key, salt, items } = await unlockVault(record, masterInput);
      const legacy = takeLegacyItems().filter(l => !items.some(i => i.pass === l.pass));
      skipNextSave.current = legacy.length === 0;
      if (legacy.length) localStorage.removeItem(LEGACY_STORAGE_KEY);
      setVault([...legacy, ...items]); setVaultSalt(salt); setVaultKey(key);
      setMasterInput('');
    } catch (e) {
      setVaultError(e instanceof WrongPasswordError ? e.message : 'Could not read the vault.');
    }
    setVaultBusy(false);
  };

  const lockVault = () => {
    setVaultKey(null); setVaultSalt(null); setVault([]);
    skipNextSave.current = true;
  };

  const saveToVault = (pass) => {
    if (!pass) return;
    if (!vaultKey) {
      notify("Unlock your vault first, then save again.", 'warn');
      setActiveTab('vault');
      return;
    }
    if (vault.some(item => item.pass === pass)) {
      notify("That password is already in your vault.", 'warn');
      return;
    }
    const newItem = {
      id: Date.now(),
      pass: pass,
      label: `Password #${vault.length + 1}`,
      date: new Date().toLocaleDateString()
    };
    setVault([newItem, ...vault]); 
    notify("Saved to your encrypted vault.");
  };

  const deleteFromVault = (id) => {
    setVault(vault.filter(item => item.id !== id));
  };

  // --- AUDITOR LOGIC ---
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (password) {
        setLoading(true);
        const analysis = analyzePassword(password);
        setStats(analysis);
        
        setHistory(prev => {
            // 1. If empty, create the "Zero Start" base
            const baseHistory = prev.length === 0 ? [{ step: 0, score: 0 }] : prev;
            
            // 2. FIXED: Get the step number from the LAST item, not the array length
            const lastStep = baseHistory[baseHistory.length - 1].step;
            
            const newEntry = { step: lastStep + 1, score: analysis.score };
            return [...baseHistory, newEntry].slice(-10);
        });
        
        if (password.length > 3) {
            const leaks = await checkPwned(password);
            setPwnedCount(leaks);
        }
        setLoading(false);
      } else {
        setStats(null);
        setPwnedCount(null);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [password]);

  // --- GENERATOR LOGIC ---
  const generatePass = () => {
    setCopied(false);
    // All randomness comes from crypto.getRandomValues (see utils/secureRandom.js).
    if (genType === 'xkcd') {
      let pass = "";
      for (let i = 0; i < XKCD_WORDS; i++) {
        const randomWord = pick(wordList);
        pass += randomWord.charAt(0).toUpperCase() + randomWord.slice(1) + (i < XKCD_WORDS - 1 ? "-" : "");
      }
      pass += 100 + randomInt(900);
      setGenPassword(pass);
    } else {
      let pass = "";
      for (let i = 0; i < RANDOM_LENGTH; i++) {
        pass += pick(RANDOM_CHARS);
      }
      setGenPassword(pass);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getColor = (score) => {
    if (score === 0) return '#ff4444'; 
    if (score < 3) return '#ffbb33';   
    return '#00C851';                  
  };

  return (
    <div className="dashboard-container">
      
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <FaShieldAlt size={80} color="#00C851" style={{ marginBottom: '10px' }} />
        <h1 className="title-glow">FORTRESS</h1>
        <p className="subtitle">Password Auditor, Generator & Encrypted Vault</p>
        <p className="branding">Architected by <span className="highlight">@kaverii11</span></p>
      </div>

      <div className="tab-container">
        <button className={`tab-btn ${activeTab === 'auditor' ? 'active' : ''}`} onClick={() => setActiveTab('auditor')}><FaSearch /> Audit</button>
        <button className={`tab-btn ${activeTab === 'generator' ? 'active' : ''}`} onClick={() => setActiveTab('generator')}><FaDice /> Generate</button>
        <button className={`tab-btn ${activeTab === 'vault' ? 'active' : ''}`} onClick={() => setActiveTab('vault')}>
           {vaultKey ? <><FaUnlock /> Vault ({vault.length})</> : <><FaLock /> Vault</>}
        </button>
      </div>

      {/* === AUDITOR TAB === */}
      {activeTab === 'auditor' && (
        <>
          <div className="input-wrapper">
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Enter password to audit" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="cyber-input"
            />
            <span className="eye-icon" role="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
             {password && (
              <span className="save-icon-input" role="button" aria-label="Save to vault" onClick={() => saveToVault(password)} title="Save to Vault">
                <FaSave />
              </span>
            )}
          </div>

          {!password && (
            <div className="empty-hint">
              Type a password to see its <strong>pattern analysis</strong>, a <strong>breach check</strong> against Have I Been Pwned,
              and how its <strong>strength</strong> changes as you edit it.
            </div>
          )}

          {stats && (
            <div className="results-panel">
              <div className="strength-bar-bg">
                <div style={{ height: '100%', width: `${(stats.score + 1) * 20}%`, backgroundColor: getColor(stats.score), transition: 'width 0.3s ease' }} />
              </div>
              
              <div className="grid-stats">
                <div className="card">
                  <h3>🧠 Pattern Analysis</h3>
                  <p style={{ color: getColor(stats.score) }}>{stats.feedback ? `⚠️ ${stats.feedback}` : "✅ No obvious patterns found."}</p>
                  <small style={{ color: '#888' }}>Time to crack: {stats.crackTime}</small>
                </div>
                <div className="card">
                  <h3>🌍 Breach Check</h3>
                  {loading ? <p>Checking...</p> : (
                    pwnedCount === null ? (
                      <p style={{ color: '#888' }}>Breach check unavailable.</p>
                    ) : pwnedCount > 0 ? (
                      <p style={{ color: '#ff4444' }}><FaExclamationTriangle /> Leaked {pwnedCount.toLocaleString()} times!</p>
                    ) : (
                      <p style={{ color: '#00C851' }}><FaCheckCircle /> No leaks found.</p>
                    )
                  )}
                  <small style={{ color: '#888' }}>Have I Been Pwned, k-anonymity: only the first 5 characters of the SHA-1 hash are sent.</small>
                </div>
              </div>

              {/* --- GRAPH --- */}
              {history.length > 0 && (
                <div className="chart-wrapper">
                    <h3>📈 Strength Trend</h3>
                    <div className="chart-area">
                        <ResponsiveContainer>
                            <LineChart data={history} margin={{ top: 10, right: 16, bottom: 8, left: -20 }}>
                                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                                <XAxis dataKey="step" hide />
                                <YAxis domain={[0, 4]} ticks={[0, 1, 2, 3, 4]} allowDecimals={false} tick={{ fill: '#8a8a8a', fontSize: 12 }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }} itemStyle={{ color: '#00C851' }} labelFormatter={(l) => `Edit ${l}`} />
                                <Line type="monotone" dataKey="score" stroke="#00C851" strokeWidth={3} dot={{r: 4, fill: '#111', stroke: '#00C851'}} isAnimationActive={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
              )}

              {/* --- NEW: SCORE GUIDE --- */}
              <div className="score-legend-wrapper">
                <h3><FaInfoCircle /> Score Guide</h3>
                <div className="score-grid">
                  <div className="score-item"><span className="badge badge-0">0</span> Too Guessable</div>
                  <div className="score-item"><span className="badge badge-1">1</span> Very Weak</div>
                  <div className="score-item"><span className="badge badge-2">2</span> Weak</div>
                  <div className="score-item"><span className="badge badge-3">3</span> Safe</div>
                  <div className="score-item"><span className="badge badge-4">4</span> Very Strong</div>
                </div>
              </div>

            </div>
          )}
        </>
      )}

      {/* === GENERATOR TAB === */}
      {activeTab === 'generator' && (
        <div className="generator-panel">
           <div className="mode-toggle" role="radiogroup" aria-label="Password type">
              <button role="radio" aria-checked={genType === 'xkcd'} className={genType === 'xkcd' ? 'active' : ''} onClick={() => setGenType('xkcd')}>
                Passphrase<small>memorable, XKCD style</small>
              </button>
              <button role="radio" aria-checked={genType === 'random'} className={genType === 'random' ? 'active' : ''} onClick={() => setGenType('random')}>
                Random<small>16 characters</small>
              </button>
           </div>
           <button className="generate-btn" onClick={generatePass}><FaDice /> Generate New</button>
           {genPassword && (
             <div className="gen-result-wrapper">
                <div className="gen-result">{genPassword}</div>
                <div className="gen-actions">
                  <button onClick={() => copyToClipboard(genPassword)}>{copied ? <><FaCheckCircle /> Copied</> : <><FaCopy /> Copy</>}</button>
                  <button title="Save to Vault" onClick={() => saveToVault(genPassword)}><FaSave /> Save to vault</button>
                </div>
             </div>
           )}
           <small className="entropy-note">
             {genType === 'xkcd'
               ? `${XKCD_WORDS} words from the EFF list (7,776 words) + a 3-digit number: about ${XKCD_BITS.toFixed(1)} bits of entropy.`
               : `${RANDOM_LENGTH} characters from a ${RANDOM_CHARS.length}-character set: about ${RANDOM_BITS.toFixed(1)} bits of entropy.`}
             {' '}Generated with crypto.getRandomValues.
           </small>
        </div>
      )}

      {/* === VAULT TAB === */}
      {activeTab === 'vault' && !vaultKey && (
        <div className="vault-panel">
          <div className="vault-lock-card">
            <FaLock size={40} style={{ marginBottom: '1rem', color: '#00C851' }} />
            <h3>{hasVault ? 'Unlock your vault' : 'Create a master password'}</h3>
            <p className="vault-lock-help">
              {hasVault
                ? 'Your vault is stored encrypted in this browser. Enter your master password to decrypt it.'
                : 'Your vault will be encrypted (AES-GCM) with a key derived from this password. It is never stored, and it cannot be recovered if you forget it.'}
            </p>
            <input type="password" className="cyber-input vault-master-input" placeholder="Master password"
              value={masterInput} onChange={(e) => setMasterInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && hasVault) openVault(); }} />
            {!hasVault && (
              <input type="password" className="cyber-input vault-master-input" placeholder="Confirm master password"
                value={masterConfirm} onChange={(e) => setMasterConfirm(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') createVault(); }} />
            )}
            {vaultError && <p className="vault-error"><FaExclamationTriangle /> {vaultError}</p>}
            <button className="generate-btn" disabled={vaultBusy} onClick={hasVault ? openVault : createVault}>
              <FaUnlock /> {vaultBusy ? 'Deriving key...' : hasVault ? 'Unlock' : 'Create encrypted vault'}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'vault' && vaultKey && (
        <div className="vault-panel">
          <div className="vault-toolbar">
            <span><FaUnlock /> Unlocked (AES-GCM, key held in memory only)</span>
            <button className="lock-btn" onClick={lockVault}><FaLock /> Lock</button>
          </div>
          {vault.length === 0 ? (
             <div style={{ textAlign: 'center', color: '#a3a3a3', padding: '2rem' }}>
              <FaHdd size={40} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <p>Your vault is empty. Save a password from the Audit or Generate tab.</p>
            </div>
          ) : (
            <div className="vault-list">
              {vault.map((item) => (
                <div key={item.id} className="vault-item">
                  <div className="vault-info"><span className="vault-pass">{item.pass}</span><span className="vault-date">{item.date}</span></div>
                  <div className="vault-actions">
                    <button aria-label="Copy" title="Copy" onClick={() => { copyToClipboard(item.pass); notify('Copied to clipboard.'); }}><FaCopy /></button>
                    <button aria-label="Delete" title="Delete" onClick={() => deleteFromVault(item.id)} className="delete-btn"><FaTrash /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="footer">
        <p>🔒 Runs in your browser. Only a 5-character hash prefix is ever sent (to Have I Been Pwned).</p>
        <div className="social-links" style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '10px' }}>
          <a href="https://github.com/kaverii11" aria-label="GitHub" target="_blank" rel="noopener noreferrer" style={{ color: '#fff', fontSize: '1.5rem' }}><FaGithub /></a>
          <a href="https://www.linkedin.com/in/kaveri-sharma-aiml/" aria-label="LinkedIn" target="_blank" rel="noopener noreferrer" style={{ color: '#0077b5', fontSize: '1.5rem' }}><FaLinkedin /></a>
        </div>
        <p style={{ marginTop: '10px', fontSize: '0.8rem', color: '#8a8a8a' }}>© {new Date().getFullYear()} Kaveri Sharma</p>
      </div>
      {toast && <div className={`toast ${toast.tone === 'warn' ? 'warn' : ''}`} role="status">{toast.text}</div>}
    </div>
  );
}
export default App;