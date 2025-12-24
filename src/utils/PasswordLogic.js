import zxcvbn from 'zxcvbn';

// 1. Semantic Analyzer
export const analyzePassword = (password) => {
  const result = zxcvbn(password);
  return {
    score: result.score, // 0-4
    feedback: result.feedback.warning || result.feedback.suggestions[0],
    crackTime: result.crack_times_display.offline_slow_hashing_1e4_per_second,
  };
};

// 2. Leak Checker 
export const checkPwned = async (password) => {
  // Hash the password with SHA-1
  const buffer = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(password));
  const hashArray = Array.from(new Uint8Array(buffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  
  const prefix = hashHex.slice(0, 5);
  const suffix = hashHex.slice(5);

  try {
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    const text = await response.text();
    
    const regex = new RegExp(`^${suffix}:([0-9]+)`, 'm');
    const match = text.match(regex);
    
    return match ? parseInt(match[1]) : 0;
  } catch (error) {
    return null; 
  }
};