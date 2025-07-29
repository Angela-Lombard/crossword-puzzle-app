// Enhanced security utilities for crossword puzzle
const SECURITY_KEY = 'mX9#pZ2$kL7&vN4!'; // Simple obfuscation key

// Multiple encoding layers
const encodeMultiLayer = (text) => {
  // Layer 1: Reverse and Caesar cipher
  const reversed = text.split('').reverse().join('');
  const caesarShifted = reversed.split('').map(char => 
    String.fromCharCode(char.charCodeAt(0) + 3)
  ).join('');
  
  // Layer 2: Base64 encoding
  const base64 = btoa(caesarShifted);
  
  // Layer 3: Simple XOR with key
  const xorEncoded = base64.split('').map((char, i) => 
    String.fromCharCode(char.charCodeAt(0) ^ SECURITY_KEY.charCodeAt(i % SECURITY_KEY.length))
  ).join('');
  
  return btoa(xorEncoded); // Final base64 wrap
};

const decodeMultiLayer = (encoded) => {
  try {
    // Reverse Layer 3: Base64 decode
    const step1 = atob(encoded);
    
    // Reverse Layer 2: XOR decode
    const xorDecoded = step1.split('').map((char, i) => 
      String.fromCharCode(char.charCodeAt(0) ^ SECURITY_KEY.charCodeAt(i % SECURITY_KEY.length))
    ).join('');
    
    // Reverse Layer 1: Base64 decode
    const base64Decoded = atob(xorDecoded);
    
    // Reverse Caesar cipher and reverse string
    const caesarDecoded = base64Decoded.split('').map(char => 
      String.fromCharCode(char.charCodeAt(0) - 3)
    ).join('');
    
    return caesarDecoded.split('').reverse().join('');
  } catch (e) {
    return '';
  }
};

// Enhanced hash function with salt
const createSecureHash = (text) => {
  const salt = 'CrosswordSalt2024';
  const combined = salt + text.toLowerCase();
  let hash = 0;
  
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = (hash & hash) >>> 0; // Convert to 32bit unsigned integer
  }
  
  // Add additional scrambling
  hash = hash ^ 0xAAAAAAAA;
  return hash.toString(36); // Base36 for shorter string
};

// Validate user input against encoded answer
const validateAnswer = (userInput, encodedAnswer, answerHash) => {
  if (!userInput || userInput.length === 0) return false;
  
  const decodedAnswer = decodeMultiLayer(encodedAnswer);
  const userHash = createSecureHash(userInput);
  
  return userHash === answerHash && userInput.toLowerCase() === decodedAnswer.toLowerCase();
};

// Generate obfuscated puzzle data
const createObfuscatedPuzzle = (words) => {
  return words.map((word, index) => ({
    id: `w_${index}_${Date.now()}`,
    clue: word.clue,
    encodedAnswer: encodeMultiLayer(word.answer),
    answerHash: createSecureHash(word.answer),
    length: word.answer.length,
    // Add fake properties to confuse
    _meta: btoa(`fake_${Math.random()}`),
    _checksum: Math.random().toString(36).substring(7)
  }));
};

// Anti-debugging measures
const addAntiDebugProtection = () => {
  // Detect if dev tools are open (basic detection)
  let devtools = { open: false };
  
  const threshold = 160;
  const detectDevTools = () => {
    if (window.outerHeight - window.innerHeight > threshold || 
        window.outerWidth - window.innerWidth > threshold) {
      devtools.open = true;
      // Scramble puzzle data in memory if dev tools detected
      if (window.puzzleData) {
        window.puzzleData = window.puzzleData.map(item => ({
          ...item,
          encodedAnswer: btoa(Math.random().toString(36)),
          answerHash: Math.random().toString(36)
        }));
      }
    }
  };
  
  // Check periodically
  setInterval(detectDevTools, 1000);
  
  try {
    console.clear();
    console.log('%cStop!', 'color: red; font-size: 50px; font-weight: bold;');
    console.log('%cThis is a browser feature intended for developers. Puzzle answers are protected.', 'color: red; font-size: 16px;');
  } catch (e) {
    // ignore
  }
};

export {
  encodeMultiLayer,
  decodeMultiLayer,
  createSecureHash,
  validateAnswer,
  createObfuscatedPuzzle,
  addAntiDebugProtection
}; 