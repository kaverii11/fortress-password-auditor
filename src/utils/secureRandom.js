// Cryptographically secure random integers from the Web Crypto API.
// Uses rejection sampling so every value in [0, max) is equally likely
// (a plain `rand % max` would favour small values).
export const randomInt = (max) => {
  if (!Number.isInteger(max) || max <= 0 || max > 2 ** 32) {
    throw new RangeError('max must be an integer in (0, 2^32]');
  }
  const limit = 2 ** 32 - (2 ** 32 % max); // largest multiple of max below 2^32
  const buf = new Uint32Array(1);
  let x;
  do {
    globalThis.crypto.getRandomValues(buf);
    x = buf[0];
  } while (x >= limit);
  return x % max;
};

export const pick = (items) => items[randomInt(items.length)];
