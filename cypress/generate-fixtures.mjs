/**
 * Generate Cypress E2E test fixture data for the dilithium5-demo app.
 *
 * Uses a fixed all-zeros seed (32 bytes) to produce deterministic keypair,
 * signs a small test file, and writes PEM + signature fixtures.
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  CryptoPublicKeyBytes,
  CryptoSecretKeyBytes,
  cryptoSignKeypair,
  cryptoSign,
} from '@theqrl/dilithium5';

const FIXTURES_DIR = join(import.meta.dirname, 'fixtures');
mkdirSync(FIXTURES_DIR, { recursive: true });

// ---------------------------------------------------------------------------
// 1. Generate keypair from a fixed 32-byte all-zeros seed
//    NOTE: The app hashes a 48-byte hexseed with shake256(dkLen:32) before
//    calling cryptoSignKeypair.  For fixtures we skip that step and pass
//    the 32-byte seed directly, since we just need a deterministic keypair.
// ---------------------------------------------------------------------------
const seed = new Uint8Array(32); // all zeros

const pk = new Uint8Array(CryptoPublicKeyBytes);
const sk = new Uint8Array(CryptoSecretKeyBytes);
cryptoSignKeypair(seed, pk, sk);

// ---------------------------------------------------------------------------
// Helpers (mirror the app's KeypairView.vue logic)
// ---------------------------------------------------------------------------
function bytesToHex(bytes) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexStringToRFC7468(hexString) {
  // hex -> raw binary string -> base64, split into 64-char lines
  const binaryString = hexString
    .match(/.{1,2}/g)
    .map((byte) => String.fromCharCode(parseInt(byte, 16)))
    .join('');
  const b = Buffer.from(binaryString, 'binary').toString('base64');
  return b.match(/.{1,64}/g).join('\n');
}

// ---------------------------------------------------------------------------
// 2. Write PEM files
// ---------------------------------------------------------------------------
const pkHex = bytesToHex(pk);
const skHex = bytesToHex(sk);

const pkPem = `-----BEGIN DILITHIUM PUBLIC KEY-----\n${hexStringToRFC7468(pkHex)}\n-----END DILITHIUM PUBLIC KEY-----`;
const skPem = `-----BEGIN DILITHIUM PRIVATE KEY-----\n${hexStringToRFC7468(skHex)}\n-----END DILITHIUM PRIVATE KEY-----`;

writeFileSync(join(FIXTURES_DIR, 'test.public'), pkPem);
writeFileSync(join(FIXTURES_DIR, 'test.private'), skPem);

// ---------------------------------------------------------------------------
// 3. Create a small test file to sign
// ---------------------------------------------------------------------------
const testContent = 'Hello Dilithium\n';
const testFilename = 'hello.txt';
writeFileSync(join(FIXTURES_DIR, testFilename), testContent);

// ---------------------------------------------------------------------------
// 4. Sign the test file (mirrors SignView.vue logic)
// ---------------------------------------------------------------------------
const msg = new Uint8Array(Buffer.from(testContent));
const sigMessage = cryptoSign(msg, sk, false);

// The app takes the first 4595 bytes of the cryptoSign output as the signature
const sigBytes = sigMessage.slice(0, 4595);
const hexSignature = bytesToHex(sigBytes);

// Signature file format: "${hexSignature} ${filename}\n"
const sigFileContent = `${hexSignature} ${testFilename}\n`;
writeFileSync(join(FIXTURES_DIR, `${testFilename}.sig`), sigFileContent);

// ---------------------------------------------------------------------------
// 5. Summary
// ---------------------------------------------------------------------------
console.log('Fixtures written to:', FIXTURES_DIR);
console.log('');

const files = [
  ['test.public', pkPem.length],
  ['test.private', skPem.length],
  [testFilename, testContent.length],
  [`${testFilename}.sig`, sigFileContent.length],
];

for (const [name, size] of files) {
  console.log(`  ${name}: ${size} bytes`);
}

console.log('');
console.log(`Public key hex length:  ${pkHex.length} chars`);
console.log(`Secret key hex length:  ${skHex.length} chars`);
console.log(`Signature hex length:   ${hexSignature.length} chars (${sigBytes.length} bytes)`);
console.log(`cryptoSign output size: ${sigMessage.length} bytes`);
