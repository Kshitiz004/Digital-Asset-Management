import { webcrypto } from 'crypto';

// Make crypto available globally for TypeORM
// TypeORM uses crypto for generating connection names
if (typeof global.crypto === 'undefined') {
  global.crypto = webcrypto as typeof globalThis.crypto;
}

// Also ensure globalThis.crypto is set (for Node.js 18+ compatibility)
if (typeof globalThis.crypto === 'undefined') {
  globalThis.crypto = webcrypto as typeof globalThis.crypto;
}
