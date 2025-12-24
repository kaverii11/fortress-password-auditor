import { useState, useEffect } from 'react';
import { analyzePassword, checkPwned } from './utils/PasswordLogic';
import { wordList } from './utils/words';
import { FaShieldAlt, FaExclamationTriangle, FaCheckCircle, FaEye, FaEyeSlash, FaDice, FaCopy } from 'react-icons/fa';
import './index.css';

function App() {
  const [activeTab, setActiveTab] = useState('auditor'); // 'auditor' or 'generator'
  
  // --- AUDITOR STATE ---
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [stats, setStats] = useState(null);
  const [pwnedCount, setPwnedCount] = useState(null);
  const [loading, setLoading] = useState(false);

  // --- GENERATOR STATE ---
  const [genPassword, setGenPassword] = useState('');
  const [genType, setGenType] = useState('xkcd'); // 'xkcd' or 'random'
  const [copied, setCopied] = useState(false);

  // --- AUDITOR LOGIC ---
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (password) {
        setLoading(true);
        const analysis = analyzePassword(password);
        setStats(analysis);
        
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
      // Pick 4 random words + 1 random number
      let pass = "";
      for (let i = 0; i < 4; i++) {
        const randomWord = wordList[Math.floor(Math.random() * wordList.length)];
        // Capitalize first letter
        pass += randomWord.charAt(0).toUpperCase() + randomWord.slice(1) + (i < 3 ? "-" : "");
      }
      // Add a random 3-digit number at the end for extra entropy
      pass += Math.floor(100 + Math.random() * 900);
      setGenPassword(pass);
    } else {
      // Standard Random (16 chars)
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
      let pass = "";
      for (let i = 0; i < 16; i++) {
        pass += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      setGenPassword(pass);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(genPassword);
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
      
      {/* --- NEW HEADER WITH BRANDING --- */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <FaShieldAlt size={80} color="#00C851" style={{ marginBottom: '10px' }} />
        <h1 className="title-glow">FORTRESS AI</h1>
        <p className="subtitle">Semantic Password Auditor and Generator</p>
        <p className="branding">Architected by <span className="highlight">@kaverii11</span></p>
      </div>

      {/* --- TAB SWITCHER --- */}
      <div className="tab-container">
        <button 
          className={`tab-btn ${activeTab === 'auditor' ? 'active' : ''}`}
          onClick={() => setActiveTab('auditor')}
        >
          Audit
        </button>
        <button 
          className={`tab-btn ${activeTab === 'generator' ? 'active' : ''}`}
          onClick={() => setActiveTab('generator')}
        >
          Generate
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
          </div>

          {stats && (
            <div className="results-panel">
              <div className="strength-bar-bg">
                <div style={{ 
                  height: '100%', 
                  width: `${(stats.score + 1) * 20}%`, 
                  backgroundColor: getColor(stats.score),
                  transition: 'width 0.3s ease'
                }} />
              </div>

              <div className="grid-stats">
                <div className="card">
                  <h3>🧠 AI Analysis</h3>
                  <p style={{ color: getColor(stats.score) }}>
                    {stats.feedback ? `⚠️ ${stats.feedback}` : "✅ No obvious patterns found."}
                  </p>
                  <small style={{ color: '#888' }}>Time to crack: {stats.crackTime}</small>
                </div>

                <div className="card">
                  <h3>🌍 Dark Web Scan</h3>
                  {loading ? <p>Scanning...</p> : (
                    pwnedCount > 0 ? (
                      <p style={{ color: '#ff4444' }}>
                        <FaExclamationTriangle /> Leaked {pwnedCount.toLocaleString()} times!
                      </p>
                    ) : (
                      <p style={{ color: '#00C851' }}>
                        <FaCheckCircle /> No leaks found.
                      </p>
                    )
                  )}
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
              <label>
                <input 
                  type="radio" 
                  name="genType" 
                  checked={genType === 'xkcd'} 
                  onChange={() => setGenType('xkcd')}
                /> XKCD (Memorable)
              </label>
              <label style={{ marginLeft: '15px' }}>
                <input 
                  type="radio" 
                  name="genType" 
                  checked={genType === 'random'} 
                  onChange={() => setGenType('random')}
                /> Random (Complex)
              </label>
           </div>

           <button className="generate-btn" onClick={generatePass}>
             <FaDice /> Generate New
           </button>

           {genPassword && (
             <div className="gen-result" onClick={copyToClipboard}>
               {genPassword}
               <span className="copy-icon">
                 {copied ? <FaCheckCircle color="#00C851" /> : <FaCopy />}
               </span>
             </div>
           )}
           {copied && <small style={{ color: '#00C851', display: 'block', marginTop: '5px' }}>Copied to clipboard!</small>}
        </div>
      )}

      {/* --- NEW FOOTER --- */}
      <div className="footer">
        <p>🔒 Secure. Private. Client-Side Only.</p>
        <p>© 2025 Kaveri Sharma</p>
      </div>

    </div>
  );
}

export default App;