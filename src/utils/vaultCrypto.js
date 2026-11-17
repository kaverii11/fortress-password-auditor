// Vault encryption with the Web Crypto API.
// master password --PBKDF2-SHA256 (600,000 iterations, 16-byte random salt)--> AES-GCM 256-bit key
// Each save uses a fresh 12-byte random IV. Only {version, kdf, iterations, salt, iv, ciphertext}
// is stored; the password and the key never leave memory.

const subtle = globalThis.crypto.subtle;
export const VAULT_VERSION = 1;
export const PBKDF2_ITERATIONS = 600000; // OWASP 2023 guidance for PBKDF2-HMAC-SHA256

const enc = new TextEncoder();
const dec = new TextDecoder();

const toB64 = (bytes) => {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
};
const fromB64 = (str) => Uint8Array.from(atob(str), (c) => c.charCodeAt(0));

export const newSalt = () => globalThis.crypto.getRandomValues(new Uint8Array(16));

export const deriveKey = async (password, salt, iterations = PBKDF2_ITERATIONS) => {
  const baseKey = await subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
  return subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false, // non-extractable: the raw key bytes can't be read back out
    ['encrypt', 'decrypt'],
  );
};

export const encryptVault = async (items, key, salt, iterations = PBKDF2_ITERATIONS) => {
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const ct = await subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(items)));
  return {
    version: VAULT_VERSION,
    kdf: 'PBKDF2-SHA256',
    iterations,
    salt: toB64(salt),
    iv: toB64(iv),
    ciphertext: toB64(new Uint8Array(ct)),
  };
};

// Throws WrongPasswordError if the key is wrong or the data was tampered with
// (AES-GCM checks an authentication tag before returning any plaintext).
export class WrongPasswordError extends Error {}

export const decryptVault = async (record, key) => {
  try {
    const pt = await subtle.decrypt({ name: 'AES-GCM', iv: fromB64(record.iv) }, key, fromB64(record.ciphertext));
    return JSON.parse(dec.decode(pt));
  } catch {
    throw new WrongPasswordError('Wrong master password (or vault data was modified).');
  }
};

// Derive the key from a stored record and decrypt it in one step.
export const unlockVault = async (record, password) => {
  const salt = fromB64(record.salt);
  const key = await deriveKey(password, salt, record.iterations);
  const items = await decryptVault(record, key);
  return { key, salt, items };
};
