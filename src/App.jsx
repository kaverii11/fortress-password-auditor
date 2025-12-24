import { useState, useEffect } from 'react';
import { analyzePassword, checkPwned } from './utils/PasswordLogic';
import { wordList } from './utils/words';
import { FaShieldAlt, FaExclamationTriangle, FaCheckCircle, FaEye, FaEyeSlash, FaDice, FaCopy, FaSave, FaTrash, FaHdd, FaGithub, FaLinkedin, FaInfoCircle } from 'react-icons/fa';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import './index.css';

function App() {
  const [activeTab, setActiveTab] = useState('auditor'); 
  
  // --- VAULT STATE ---
  const [vault, setVault] = useState(() => {
    const saved = localStorage.getItem('fortressVault');
    return saved ? JSON.parse(saved) : [];
  });

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

  // --- PERSIST VAULT ---
  useEffect(() => {
    localStorage.setItem('fortressVault', JSON.stringify(vault));
  }, [vault]);

  const saveToVault = (pass) => {
    if (!pass) return;
    if (vault.some(item => item.pass === pass)) {
      alert("Password already in Vault!");
      return;
    }
    const newItem = {
      id: Date.now(),
      pass: pass,
      label: `Password #${vault.length + 1}`,
      date: new Date().toLocaleDateString()
    };
    setVault([newItem, ...vault]); 
    alert("Saved to Vault!");
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
            const newEntry = { step: prev.length + 1, score: analysis.score };
            return [...prev, newEntry].slice(-10);
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
    if (genType === 'xkcd') {
      let pass = "";
      for (let i = 0; i < 4; i++) {
        const randomWord = wordList[Math.floor(Math.random() * wordList.length)];
        pass += randomWord.charAt(0).toUpperCase() + randomWord.slice(1) + (i < 3 ? "-" : "");
      }
      pass += Math.floor(100 + Math.random() * 900);
      setGenPassword(pass);
    } else {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
      let pass = "";
      for (let i = 0; i < 16; i++) {
        pass += chars.charAt(Math.floor(Math.random() * chars.length));
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
        <h1 className="title-glow">FORTRESS AI</h1>
        <p className="subtitle">Semantic Password Auditor, Generator & Vault</p>
        <p className="branding">Architected by <span className="highlight">@kaverii11</span></p>
      </div>

      <div className="tab-container">
        <button className={`tab-btn ${activeTab === 'auditor' ? 'active' : ''}`} onClick={() => setActiveTab('auditor')}>Audit</button>
        <button className={`tab-btn ${activeTab === 'generator' ? 'active' : ''}`} onClick={() => setActiveTab('generator')}>Generate</button>
        <button className={`tab-btn ${activeTab === 'vault' ? 'active' : ''}`} onClick={() => setActiveTab('vault')}>
           Vault ({vault.length})
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
            <span className="eye-icon" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
             {password && (
              <span className="save-icon-input" onClick={() => saveToVault(password)} title="Save to Vault">
                <FaSave />
              </span>
            )}
          </div>

          {stats && (
            <div className="results-panel">
              <div className="strength-bar-bg">
                <div style={{ height: '100%', width: `${(stats.score + 1) * 20}%`, backgroundColor: getColor(stats.score), transition: 'width 0.3s ease' }} />
              </div>
              
              <div className="grid-stats">
                <div className="card">
                  <h3>🧠 AI Analysis</h3>
                  <p style={{ color: getColor(stats.score) }}>{stats.feedback ? `⚠️ ${stats.feedback}` : "✅ No obvious patterns found."}</p>
                  <small style={{ color: '#888' }}>Time to crack: {stats.crackTime}</small>
                </div>
                <div className="card">
                  <h3>🌍 Dark Web Scan</h3>
                  {loading ? <p>Scanning...</p> : (
                    pwnedCount > 0 ? (
                      <p style={{ color: '#ff4444' }}><FaExclamationTriangle /> Leaked {pwnedCount.toLocaleString()} times!</p>
                    ) : (
                      <p style={{ color: '#00C851' }}><FaCheckCircle /> No leaks found.</p>
                    )
                  )}
                </div>
              </div>

              {/* --- GRAPH --- */}
              {history.length > 1 && (
                <div className="chart-wrapper">
                    <h3 style={{marginBottom: '10px', color: '#666'}}>📈 Strength Trend</h3>
                    <div style={{ width: '100%', height: 150 }}>
                        <ResponsiveContainer>
                            <LineChart data={history}>
                                <XAxis dataKey="step" hide />
                                <YAxis domain={[0, 4]} hide />
                                <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }} itemStyle={{ color: '#00C851' }} />
                                <Line type="monotone" dataKey="score" stroke="#00C851" strokeWidth={3} dot={{r: 4, fill: '#111', stroke: '#00C851'}} />
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
           <div className="gen-controls">
              <label><input type="radio" name="genType" checked={genType === 'xkcd'} onChange={() => setGenType('xkcd')} /> XKCD (Memorable)</label>
              <label style={{ marginLeft: '15px' }}><input type="radio" name="genType" checked={genType === 'random'} onChange={() => setGenType('random')} /> Random (Complex)</label>
           </div>
           <button className="generate-btn" onClick={generatePass}><FaDice /> Generate New</button>
           {genPassword && (
             <div className="gen-result-wrapper">
                <div className="gen-result">{genPassword}</div>
                <div className="gen-actions">
                  <button onClick={() => copyToClipboard(genPassword)} title="Copy"><FaCopy /></button>
                  <button onClick={() => saveToVault(genPassword)} title="Save to Vault"><FaSave /></button>
                </div>
             </div>
           )}
           {copied && <small style={{ color: '#00C851', display: 'block', marginTop: '5px', textAlign: 'center' }}>Copied!</small>}
        </div>
      )}

      {/* === VAULT TAB === */}
      {activeTab === 'vault' && (
        <div className="vault-panel">
          {vault.length === 0 ? (
             <div style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
              <FaHdd size={40} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <p>Your vault is empty.</p>
            </div>
          ) : (
            <div className="vault-list">
              {vault.map((item) => (
                <div key={item.id} className="vault-item">
                  <div className="vault-info"><span className="vault-pass">{item.pass}</span><span className="vault-date">{item.date}</span></div>
                  <div className="vault-actions">
                    <button onClick={() => copyToClipboard(item.pass)}><FaCopy /></button>
                    <button onClick={() => deleteFromVault(item.id)} className="delete-btn"><FaTrash /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="footer">
        <p>🔒 Secure. Private. Client-Side Only.</p>
        <div className="social-links" style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '10px' }}>
          <a href="https://github.com/kaverii11" target="_blank" rel="noopener noreferrer" style={{ color: '#fff', fontSize: '1.5rem' }}><FaGithub /></a>
          <a href="https://www.linkedin.com/in/kaveri-sharma-48220926a/" target="_blank" rel="noopener noreferrer" style={{ color: '#0077b5', fontSize: '1.5rem' }}><FaLinkedin /></a>
        </div>
        <p style={{ marginTop: '10px', fontSize: '0.8rem', color: '#666' }}>© 2025 Kaveri Sharma</p>
      </div>
    </div>
  );
}
export default App;