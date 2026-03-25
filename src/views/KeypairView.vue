<template>
  <main class="view-enter">
    <div class="stagger">
      <div class="section-label">Post-Quantum Keys</div>
      <h1 class="section-title">Keypair</h1>

      <!-- Generate section -->
      <div v-if="allowActions()">
        <div class="generate-panel mb-4">
          <div class="generate-panel__header">
            <span class="generate-panel__title">Generate random keypair</span>
            <button class="btn-action btn-action--primary" @click="generateKeypair(true)">Generate</button>
          </div>
        </div>

        <hr class="divider" />

        <div class="generate-panel">
          <div class="generate-panel__header mb-3">
            <span class="generate-panel__title">Regenerate from hexseed</span>
          </div>
          <div class="crypto-input">
            <input
              v-model="hexseed"
              type="text"
              class="crypto-input__field"
              placeholder="Enter 96-character hexseed..."
              @input="reset()"
            />
            <button class="crypto-input__btn crypto-input__btn--primary" @click="generateKeypair(false)">Generate</button>
          </div>
          <div v-if="!isValid(hexseed) && hexseed.length > 0" class="error-msg mt-3">
            Hexseed must be 96 hex characters long
          </div>
        </div>
      </div>

      <!-- Reset -->
      <div v-if="!allowActions()" class="mb-4">
        <button class="btn-action btn-action--danger" @click="clear()">Reset Keypair</button>
      </div>

      <hr class="divider" />

      <!-- Key output -->
      <div v-if="!allowActions()">
        <!-- Address -->
        <div class="mb-4">
          <div class="d-flex align-items-center justify-content-between mb-2">
            <div class="section-label mb-0">ID / Address</div>
            <button class="btn-action" @click="copyToClipboard('address')">Copy</button>
          </div>
          <div class="address-display">{{ address }}</div>
        </div>

        <!-- Hexseed -->
        <div class="mb-4">
          <div class="section-label">Hexseed</div>
          <div class="crypto-input">
            <input type="text" class="crypto-input__field" :value="validatedHS(hexseed)" readonly />
            <button class="crypto-input__btn" @click="copyToClipboard('hexseed')">Copy</button>
            <button class="crypto-input__btn crypto-input__btn--primary" @click="download('hexseed')">Download</button>
          </div>
        </div>

        <!-- Public Key -->
        <div class="mb-4">
          <div class="section-label">Public Key</div>
          <div class="crypto-input">
            <input v-model="pk" type="text" class="crypto-input__field" readonly />
            <button class="crypto-input__btn" @click="copyToClipboard('pk')">Copy</button>
            <button class="crypto-input__btn crypto-input__btn--primary" @click="download('pk')">Download</button>
          </div>
        </div>

        <!-- Secret Key -->
        <div class="mb-4">
          <div class="section-label">Secret Key</div>
          <div class="crypto-input">
            <input v-model="sk" type="text" class="crypto-input__field" readonly />
            <button class="crypto-input__btn" @click="copyToClipboard('sk')">Copy</button>
            <button class="crypto-input__btn crypto-input__btn--primary" @click="download('sk')">Download</button>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script>
import { ref } from 'vue';
import { CryptoPublicKeyBytes, CryptoSecretKeyBytes, cryptoSignKeypair } from '@theqrl/dilithium5';
import { shake256 } from '@noble/hashes/sha3.js';

export default {
  setup() {
    const hexseed = ref('');
    const pk = ref('');
    const sk = ref('');
    const address = ref('');

    const getDilithiumDescriptor = (addr) => {
      if (!addr) {
        throw new Error('Address is not defined');
      }
      return 2 << 4;
    };

    const getDilithiumAddressFromPK = (pkToHash) => {
      const addressSize = 20;
      const addr = new Uint8Array(addressSize);
      const descBytes = getDilithiumDescriptor(addr);
      addr[0] = descBytes;
      const hashedKeyDigest = shake256(pkToHash, { dkLen: 32 });
      const start = hashedKeyDigest.length - addressSize + 1;
      for (let i = 0; i < addressSize - 1; i++) {
        addr[i + 1] = hashedKeyDigest[start + i];
      }
      return addr;
    };

    const randomBytes = (size) => {
      const array = new Uint8Array(size);
      window.crypto.getRandomValues(array);
      return array;
    };

    const reset = () => {
      pk.value = '';
      sk.value = '';
      address.value = '';
    };

    const clear = () => {
      reset();
      hexseed.value = '';
    };

    const copyToClipboard = (type) => {
      let text = '';
      switch (type) {
        case 'hexseed':
          text = hexseed.value;
          break;
        case 'pk':
          text = pk.value;
          break;
        case 'sk':
          text = sk.value;
          break;
        case 'address':
          text = address.value;
          break;
        default:
          break;
      }
      navigator.clipboard.writeText(text);
    };

    const hexStringToRFC7468 = (hexString) => {
      const binaryString = hexString
        .match(/.{1,2}/g)
        .map((byte) => String.fromCharCode(parseInt(byte, 16)))
        .join('');
      const b = btoa(binaryString);
      return b.match(/.{1,64}/g).join('\n');
    };

    const download = (type) => {
      let text = '';
      let filename = address.value;
      switch (type) {
        case 'hexseed':
          text = `-----BEGIN DILITHIUM PRIVATE HEXSEED-----\n${hexStringToRFC7468(
            hexseed.value
          )}\n-----END DILITHIUM PRIVATE HEXSEED-----`;
          filename += '.private.hexseed';
          break;
        case 'pk':
          text = `-----BEGIN DILITHIUM PUBLIC KEY-----\n${hexStringToRFC7468(
            pk.value
          )}\n-----END DILITHIUM PUBLIC KEY-----`;
          filename += '.public';
          break;
        case 'sk':
          text = `-----BEGIN DILITHIUM PRIVATE KEY-----\n${hexStringToRFC7468(
            sk.value
          )}\n-----END DILITHIUM PRIVATE KEY-----`;
          filename += '.private';
          break;
        default:
          break;
      }
      const element = document.createElement('a');
      const file = new Blob([text], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = filename;
      document.body.appendChild(element);
      element.click();
    };

    const isValid = (hs) => {
      if (hs.length !== 96) {
        return false;
      }
      if (!/^[0-9A-Fa-f]+$/.test(hs)) {
        return false;
      }
      return true;
    };

    const validatedHS = (hs) => {
      if (isValid(hs)) {
        return hs;
      }
      return '';
    };

    const hexToBytes = (hex) => {
      const bytes = new Uint8Array(hex.length / 2);
      for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
      }
      return bytes;
    };

    const bytesToHex = (bytes) => {
      return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    };

    const generateKeypair = async (useRandom) => {
      const pkGen = new Uint8Array(CryptoPublicKeyBytes);
      const skGen = new Uint8Array(CryptoSecretKeyBytes);
      let seed;
      if (useRandom) {
        seed = randomBytes(48);
      } else {
        if (hexseed.value.length !== 96) {
          return;
        }
        seed = hexToBytes(hexseed.value);
      }
      const hashedSeed = shake256(seed, { dkLen: 32 });
      cryptoSignKeypair(hashedSeed, pkGen, skGen);
      pk.value = bytesToHex(pkGen);
      sk.value = bytesToHex(skGen);
      hexseed.value = bytesToHex(seed);
      const addrBytes = getDilithiumAddressFromPK(pkGen);
      address.value = bytesToHex(addrBytes);
    };

    const allowActions = () => {
      if (sk.value.length === 0) {
        return true;
      }
      return false;
    };

    return {
      hexseed,
      pk,
      sk,
      address,
      generateKeypair,
      reset,
      isValid,
      validatedHS,
      getDilithiumAddressFromPK,
      getDilithiumDescriptor,
      copyToClipboard,
      download,
      allowActions,
      clear,
    };
  },
};
</script>

<style scoped>
.generate-panel {
  background: var(--surface-1);
  border: 1px solid var(--surface-3);
  border-radius: var(--radius);
  padding: 1.25rem 1.5rem;
}

.generate-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.generate-panel__title {
  font-size: 0.95rem;
  color: var(--text-primary);
}
</style>
