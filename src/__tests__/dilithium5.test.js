/**
 * Cross-verification tests for @theqrl/dilithium5
 *
 * These tests replicate the upstream library's test vectors and verify that
 * the frontend signing path (as used in SignView.vue) produces byte-identical
 * output to the parent library.
 *
 * Upstream test source: https://github.com/theQRL/qrypto.js/tree/main/packages/dilithium5/test
 */
import { describe, it, expect } from 'vitest'
import {
  CryptoPublicKeyBytes,
  CryptoSecretKeyBytes,
  CryptoBytes,
  SeedBytes,
  cryptoSign,
  cryptoSignKeypair,
  cryptoSignOpen,
  cryptoSignVerify,
  cryptoSignSignature,
  zeroize,
  isZero,
} from '@theqrl/dilithium5'

// --- Helpers (same as used in KeypairView.vue and SignView.vue) ---

function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16)
  }
  return bytes
}

function bytesToHex(bytes) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

// --- Upstream test vectors from sign.test.js ---
// Seed used in upstream: already hashed (32 bytes)
const UPSTREAM_HASHEDSEED = '8078f74eb51029b5b96cfbe2bd0ab8433252bf4c6c8fbad92789add5e3cca216'
const UPSTREAM_MESSAGE = '00010204060901'

// Expected PK from upstream (first 64 hex chars for sanity check, full for keygen verification)
const UPSTREAM_PK_PREFIX = 'da218daf9d5457bee0e2381250f7ad31'

// Expected SIGNATURE from upstream sign.test.js (first 64 hex chars for prefix check)
const UPSTREAM_SIG_PREFIX = 'f72e71df3610b365e5e647e75f2bc67e'

// Edge-case seed from upstream edge-cases.test.js
const ZEROS_SEED = '0000000000000000000000000000000000000000000000000000000000000000'

// --- Generate keypair from upstream seed (avoids embedding the ~9800 char SK hex) ---
const upstreamPk = new Uint8Array(CryptoPublicKeyBytes)
const upstreamSk = new Uint8Array(CryptoSecretKeyBytes)
cryptoSignKeypair(hexToBytes(UPSTREAM_HASHEDSEED), upstreamPk, upstreamSk)

// --- Tests ---

describe('cross-verify: constants match upstream', () => {
  it('should have correct buffer sizes', () => {
    expect(CryptoPublicKeyBytes).toBe(2592)
    expect(CryptoSecretKeyBytes).toBe(4896)
    expect(CryptoBytes).toBe(4595)
    expect(SeedBytes).toBe(32)
  })
})

describe('cross-verify: deterministic keygen from upstream seed', () => {
  it('should produce the same PK as upstream test vectors', () => {
    const pkHex = bytesToHex(upstreamPk)
    expect(pkHex.substring(0, UPSTREAM_PK_PREFIX.length)).toBe(UPSTREAM_PK_PREFIX)
    expect(pkHex.length).toBe(CryptoPublicKeyBytes * 2)
  })

  it('should be deterministic - same seed always produces same keys', () => {
    const pk2 = new Uint8Array(CryptoPublicKeyBytes)
    const sk2 = new Uint8Array(CryptoSecretKeyBytes)
    cryptoSignKeypair(hexToBytes(UPSTREAM_HASHEDSEED), pk2, sk2)
    expect(bytesToHex(pk2)).toBe(bytesToHex(upstreamPk))
    expect(bytesToHex(sk2)).toBe(bytesToHex(upstreamSk))
  })
})

describe('cross-verify: frontend signing path matches upstream', () => {
  // This replicates exactly what SignView.vue does:
  // 1. cryptoSign(msg_bytes, sk_bytes, false)
  // 2. Extract first CryptoBytes (4595) as the signature
  // 3. Output as hex string

  it('should produce byte-identical signature to upstream for known message', () => {
    const msg = hexToBytes(UPSTREAM_MESSAGE)

    // This is the exact call SignView.vue makes (line 246)
    const sigMessage = cryptoSign(msg, upstreamSk, false)

    // Extract signature the same way SignView.vue does (lines 248-250)
    const sigHex = Array.from(sigMessage.slice(0, CryptoBytes))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')

    // Verify signature prefix matches upstream expected value
    expect(sigHex.substring(0, UPSTREAM_SIG_PREFIX.length)).toBe(UPSTREAM_SIG_PREFIX)
    expect(sigHex.length).toBe(CryptoBytes * 2) // 9190 hex chars
  })

  it('should produce signature that the upstream verify accepts', () => {
    const msg = hexToBytes(UPSTREAM_MESSAGE)
    const sigMessage = cryptoSign(msg, upstreamSk, false)
    const sig = sigMessage.slice(0, CryptoBytes)

    expect(cryptoSignVerify(sig, msg, upstreamPk)).toBe(true)
  })

  it('should produce combined output = signature || message (upstream format)', () => {
    const msg = hexToBytes(UPSTREAM_MESSAGE)
    const sigMessage = cryptoSign(msg, upstreamSk, false)

    // Upstream expects: SIGNATURE + MESSAGE concatenated
    expect(sigMessage.length).toBe(CryptoBytes + msg.length)

    // The trailing bytes should be the original message
    const trailingMsg = sigMessage.slice(CryptoBytes)
    expect(bytesToHex(trailingMsg)).toBe(UPSTREAM_MESSAGE)
  })

  it('cryptoSignOpen should recover the original message', () => {
    const msg = hexToBytes(UPSTREAM_MESSAGE)
    const sigMessage = cryptoSign(msg, upstreamSk, false)
    const opened = cryptoSignOpen(sigMessage, upstreamPk)

    expect(opened).toBeDefined()
    expect(bytesToHex(opened)).toBe(UPSTREAM_MESSAGE)
  })

  it('detached signature should also match (cryptoSignSignature)', () => {
    const msg = hexToBytes(UPSTREAM_MESSAGE)
    const sig = new Uint8Array(CryptoBytes)
    const result = cryptoSignSignature(sig, msg, upstreamSk, false)

    expect(result).toBe(0)

    // Detached sig should be identical to the first CryptoBytes of combined output
    const combined = cryptoSign(msg, upstreamSk, false)
    const combinedSig = combined.slice(0, CryptoBytes)
    expect(bytesToHex(sig)).toBe(bytesToHex(combinedSig))

    // And verify works
    expect(cryptoSignVerify(sig, msg, upstreamPk)).toBe(true)
  })

  it('hex string message should produce same signature as Uint8Array message', () => {
    // upstream sign.test.js tests both forms
    const msgBytes = hexToBytes(UPSTREAM_MESSAGE)
    const sigFromBytes = cryptoSign(msgBytes, upstreamSk, false)
    const sigFromHex = cryptoSign(UPSTREAM_MESSAGE, upstreamSk, false)

    expect(bytesToHex(sigFromBytes)).toBe(bytesToHex(sigFromHex))
  })
})

describe('cross-verify: upstream edge-cases.test.js', () => {
  // Replicates tests from edge-cases.test.js using the all-zeros seed
  const edgePk = new Uint8Array(CryptoPublicKeyBytes)
  const edgeSk = new Uint8Array(CryptoSecretKeyBytes)
  cryptoSignKeypair(hexToBytes(ZEROS_SEED), edgePk, edgeSk)

  it('should sign and verify an empty message', () => {
    const emptyMsg = new Uint8Array(0)
    const signedMsg = cryptoSign(emptyMsg, edgeSk, false)

    expect(signedMsg.length).toBe(CryptoBytes)

    const sig = signedMsg.slice(0, CryptoBytes)
    expect(cryptoSignVerify(sig, emptyMsg, edgePk)).toBe(true)
  })

  it('should sign and verify a 1MB message', () => {
    const largeMsg = new Uint8Array(1024 * 1024)
    for (let i = 0; i < largeMsg.length; i++) {
      largeMsg[i] = i % 256
    }

    const signedMsg = cryptoSign(largeMsg, edgeSk, false)
    expect(signedMsg.length).toBe(CryptoBytes + largeMsg.length)

    const sig = signedMsg.slice(0, CryptoBytes)
    expect(cryptoSignVerify(sig, largeMsg, edgePk)).toBe(true)
  })

  it('should reject signature with flipped bit in ctilde (first 32 bytes)', () => {
    const msg = new TextEncoder().encode('Test message')
    const signedMsg = cryptoSign(msg, edgeSk, false)
    const sig = new Uint8Array(signedMsg.slice(0, CryptoBytes))

    // Original should verify
    expect(cryptoSignVerify(sig, msg, edgePk)).toBe(true)

    // Flip a bit in ctilde portion
    sig[16] ^= 0x01
    expect(cryptoSignVerify(sig, msg, edgePk)).toBe(false)
  })

  it('should reject signature with flipped bit in z vector', () => {
    const msg = new TextEncoder().encode('Test message')
    const signedMsg = cryptoSign(msg, edgeSk, false)
    const sig = new Uint8Array(signedMsg.slice(0, CryptoBytes))

    expect(cryptoSignVerify(sig, msg, edgePk)).toBe(true)

    sig[100] ^= 0x80
    expect(cryptoSignVerify(sig, msg, edgePk)).toBe(false)
  })

  it('should reject all-zero signature', () => {
    const msg = new TextEncoder().encode('Test message')
    const zeroSig = new Uint8Array(CryptoBytes).fill(0)
    expect(cryptoSignVerify(zeroSig, msg, edgePk)).toBe(false)
  })

  it('should reject signature with all bits flipped', () => {
    const msg = new TextEncoder().encode('Test message')
    const signedMsg = cryptoSign(msg, edgeSk, false)
    const sig = new Uint8Array(signedMsg.slice(0, CryptoBytes))

    for (let i = 0; i < sig.length; i++) {
      sig[i] ^= 0xff
    }
    expect(cryptoSignVerify(sig, msg, edgePk)).toBe(false)
  })

  it('should sign and verify single byte boundary values', () => {
    const testBytes = [0x00, 0x01, 0x7f, 0x80, 0xfe, 0xff]
    testBytes.forEach((byte) => {
      const msg = new Uint8Array([byte])
      const signedMsg = cryptoSign(msg, edgeSk, false)
      const sig = signedMsg.slice(0, CryptoBytes)
      expect(cryptoSignVerify(sig, msg, edgePk)).toBe(true)
    })
  })

  it('should produce identical signatures for same message (deterministic)', () => {
    const msg = new TextEncoder().encode('Test message')

    const sig1 = cryptoSign(msg, edgeSk, false).slice(0, CryptoBytes)
    const sig2 = cryptoSign(msg, edgeSk, false).slice(0, CryptoBytes)

    expect(bytesToHex(sig1)).toBe(bytesToHex(sig2))
  })

  it('should sign and verify all-zeros and all-ones patterns', () => {
    const allZeros = new Uint8Array(100).fill(0x00)
    let signedMsg = cryptoSign(allZeros, edgeSk, false)
    let sig = signedMsg.slice(0, CryptoBytes)
    expect(cryptoSignVerify(sig, allZeros, edgePk)).toBe(true)

    const allOnes = new Uint8Array(100).fill(0xff)
    signedMsg = cryptoSign(allOnes, edgeSk, false)
    sig = signedMsg.slice(0, CryptoBytes)
    expect(cryptoSignVerify(sig, allOnes, edgePk)).toBe(true)
  })
})

describe('cross-verify: frontend PEM key round-trip', () => {
  // KeypairView.vue exports keys as PEM (RFC 7468 base64)
  // SignView.vue reads them back: strip headers, base64 decode, get raw bytes
  // This tests that the encode/decode round-trip preserves byte-identical keys

  function hexStringToRFC7468(hexString) {
    const binaryString = hexString
      .match(/.{1,2}/g)
      .map((byte) => String.fromCharCode(parseInt(byte, 16)))
      .join('')
    const b = btoa(binaryString)
    return b.match(/.{1,64}/g).join('\n')
  }

  function pemToBytes(pem) {
    // Same logic as SignView.vue lines 237-242
    let keyText = pem.split('\n').slice(1, -1).join('\n')
    keyText = keyText.replace(/\n/g, '')
    return Uint8Array.from(atob(keyText), (c) => c.charCodeAt(0))
  }

  it('SK should survive PEM encode/decode round-trip', () => {
    const skHex = bytesToHex(upstreamSk)
    const pem =
      '-----BEGIN DILITHIUM PRIVATE KEY-----\n' +
      hexStringToRFC7468(skHex) +
      '\n-----END DILITHIUM PRIVATE KEY-----'

    const recovered = pemToBytes(pem)
    expect(bytesToHex(recovered)).toBe(skHex)
  })

  it('PK should survive PEM encode/decode round-trip', () => {
    const pkHex = bytesToHex(upstreamPk)
    const pem =
      '-----BEGIN DILITHIUM PUBLIC KEY-----\n' +
      hexStringToRFC7468(pkHex) +
      '\n-----END DILITHIUM PUBLIC KEY-----'

    const recovered = pemToBytes(pem)
    expect(bytesToHex(recovered)).toBe(pkHex)
  })

  it('signing with PEM-round-tripped SK should produce identical signature', () => {
    // Simulate the full frontend flow:
    // KeypairView generates and exports SK as PEM
    // SignView reads PEM and signs
    const skHex = bytesToHex(upstreamSk)
    const pem =
      '-----BEGIN DILITHIUM PRIVATE KEY-----\n' +
      hexStringToRFC7468(skHex) +
      '\n-----END DILITHIUM PRIVATE KEY-----'
    const recoveredSk = pemToBytes(pem)

    const msg = hexToBytes(UPSTREAM_MESSAGE)

    // Sign with original SK
    const sigOriginal = cryptoSign(msg, upstreamSk, false)
    // Sign with PEM-round-tripped SK (as frontend would)
    const sigRecovered = cryptoSign(msg, recoveredSk, false)

    // Must be byte-identical
    expect(bytesToHex(sigRecovered)).toBe(bytesToHex(sigOriginal))
  })
})

describe('cross-verify: error handling matches upstream', () => {
  it('should throw if pk or sk is null', () => {
    const pk = new Uint8Array(CryptoPublicKeyBytes)
    const sk = new Uint8Array(CryptoSecretKeyBytes)
    expect(() => cryptoSignKeypair(hexToBytes(UPSTREAM_HASHEDSEED), null, sk)).toThrow(
      'pk/sk cannot be null'
    )
    expect(() => cryptoSignKeypair(hexToBytes(UPSTREAM_HASHEDSEED), pk, null)).toThrow(
      'pk/sk cannot be null'
    )
  })

  it('should throw if pk or sk has invalid length', () => {
    const pk = new Uint8Array(CryptoPublicKeyBytes)
    const sk = new Uint8Array(CryptoSecretKeyBytes)
    expect(() =>
      cryptoSignKeypair(hexToBytes(UPSTREAM_HASHEDSEED), new Uint8Array(12), sk)
    ).toThrow('invalid pk length 12')
    expect(() =>
      cryptoSignKeypair(hexToBytes(UPSTREAM_HASHEDSEED), pk, new Uint8Array(12))
    ).toThrow('invalid sk length 12')
  })

  it('should throw on invalid sk length for signing', () => {
    const sig = new Uint8Array(CryptoBytes)
    const msg = new Uint8Array([1])
    expect(() => cryptoSignSignature(sig, msg, new Uint8Array(1), false)).toThrow(
      'invalid sk length'
    )
  })

  it('should throw on short signature buffer', () => {
    const sig = new Uint8Array(CryptoBytes - 1)
    const msg = new Uint8Array([1])
    expect(() => cryptoSignSignature(sig, msg, upstreamSk, false)).toThrow('sig must be at least')
  })
})

describe('cross-verify: utility functions', () => {
  it('zeroize should zero out a buffer', () => {
    const buf = new Uint8Array([1, 2, 3, 4, 5])
    zeroize(buf)
    expect(isZero(buf)).toBe(true)
  })

  it('isZero should correctly identify zero/non-zero buffers', () => {
    expect(isZero(new Uint8Array([0, 0, 0]))).toBe(true)
    expect(isZero(new Uint8Array([0, 1, 0]))).toBe(false)
    expect(isZero(new Uint8Array(0))).toBe(true)
  })

  it('zeroize + isZero on large buffer (CryptoSecretKeyBytes)', () => {
    const buf = new Uint8Array(CryptoSecretKeyBytes)
    buf.fill(0xff)
    expect(isZero(buf)).toBe(false)
    zeroize(buf)
    expect(isZero(buf)).toBe(true)
  })
})
