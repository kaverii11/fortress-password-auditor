import { useState, useEffect } from 'react';
import { analyzePassword, checkPwned } from './utils/PasswordLogic';
import { FaShieldAlt, FaExclamationTriangle, FaCheckCircle, FaEye, FaEyeSlash } from 'react-icons/fa'; // <--- Added Eye Icons
import './index.css';

function App() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // <--- New State for visibility
  const [stats, setStats] = useState(null);
  const [pwnedCount, setPwnedCount] = useState(null);
  const [loading, setLoading] = useState(false);

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

  const getColor = (score) => {
    if (score === 0) return '#ff4444'; 
    if (score < 3) return '#ffbb33';   
    return '#00C851';                  
  };

  return (
    <div className="dashboard-container">
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <FaShieldAlt size={50} color="#00C851" />
        <h1>FORTRESS AI</h1>
        <p style={{ color: '#888' }}>Semantic Password Auditor</p>
      </div>

      {/* --- PASSWORD INPUT WITH EYE ICON --- */}
      <div className="input-wrapper">
        <input 
          type={showPassword ? "text" : "password"} // <--- Toggles between text and password
          placeholder="Enter password to audit..." 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="cyber-input"
        />
        <span 
          className="eye-icon"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? <FaEyeSlash /> : <FaEye />}
        </span>
      </div>
      {/* ---------------------------------- */}

      {stats && (
        <div className="results-panel">
          {/* Strength Bar */}
          <div className="strength-bar-bg">
            <div style={{ 
              height: '100%', 
              width: `${(stats.score + 1) * 20}%`, 
              backgroundColor: getColor(stats.score),
              transition: 'width 0.3s ease'
            }} />
          </div>

          <div className="grid-stats">
            {/* Card 1: AI Feedback */}
            <div className="card">
              <h3>🧠 AI Analysis</h3>
              <p style={{ color: getColor(stats.score) }}>
                {stats.feedback ? `⚠️ ${stats.feedback}` : "✅ No obvious patterns found."}
              </p>
              <small style={{ color: '#888' }}>Time to crack: {stats.crackTime}</small>
            </div>

            {/* Card 2: Leak Check */}
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
    </div>
  );
}

export default App;