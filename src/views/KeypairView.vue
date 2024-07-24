<template>
  <main>
    <div class="container">
      <h4 v-if="allowActions()">Generate new random keypair</h4>
      <button v-if="allowActions()" class="btn btn-outline-secondary" type="button" @click="generateKeypair(true)">
        Generate
      </button>
      <button v-if="!allowActions()" class="btn btn-outline-danger" type="button" @click="clear()">Reset</button>
    </div>
    <hr v-if="allowActions()" />
    <div v-if="allowActions()" class="container">
      <h4>Regenerate keypair from existing hexseed</h4>
      <div class="input-group mb-3">
        <input v-model="hexseed" type="text" class="form-control" placeholder="Hexseed" @input="reset()" />
        <div class="input-group-append">
          <button class="btn btn-outline-secondary" type="button" @click="generateKeypair(false)">Generate</button>
        </div>
      </div>
      <label v-if="!isValid(hexseed) && hexseed.length > 0" class="form-check-label alert alert-danger">
        Hexseed must be 96 hex characters long
      </label>
    </div>
    <hr />
    <div v-if="!allowActions()">
      <div class="container">
        <h4>
          ID/Address
          <small
            >{{ address }}
            <button class="btn btn-outline-secondary btn-sm" @click="copyToClipboard('address')">Copy</button></small
          >
        </h4>
        <h5>Hexseed</h5>
        <div class="input-group mb-3">
          <input type="text" class="form-control" :value="validatedHS(hexseed)" readonly />
          <div class="input-group-append">
            <button
              :disabled="allowActions()"
              class="btn btn-outline-secondary"
              type="button"
              @click="copyToClipboard('hexseed')"
            >
              Copy
            </button>
          </div>
          <div class="input-group-append">
            <button
              :disabled="allowActions()"
              class="btn btn-outline-primary"
              type="button"
              @click="download('hexseed')"
            >
              Download
            </button>
          </div>
        </div>
      </div>
      <div class="container">
        <h5>Public key</h5>
        <div class="input-group mb-3">
          <input v-model="pk" type="text" class="form-control" readonly />
          <div class="input-group-append">
            <button
              :disabled="allowActions()"
              class="btn btn-outline-secondary"
              type="button"
              @click="copyToClipboard('pk')"
            >
              Copy
            </button>
          </div>
          <div class="input-group-append">
            <button :disabled="allowActions()" class="btn btn-outline-primary" type="button" @click="download('pk')">
              Download
            </button>
          </div>
        </div>
      </div>
      <div class="container">
        <h5>Secret key</h5>
        <div class="input-group mb-3">
          <input v-model="sk" type="text" class="form-control" readonly />
          <div class="input-group-append">
            <button
              :disabled="allowActions()"
              class="btn btn-outline-secondary"
              type="button"
              @click="copyToClipboard('sk')"
            >
              Copy
            </button>
          </div>
          <div class="input-group-append">
            <button :disabled="allowActions()" class="btn btn-outline-primary" type="button" @click="download('sk')">
              Download
            </button>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>
<script>
import { ref } from 'vue';
import { CryptoPublicKeyBytes, CryptoSecretKeyBytes, cryptoSignKeypair } from '@theqrl/dilithium5';
import { SHAKE } from 'sha3';

export default {
  setup() {
    const hexseed = ref('');
    const pk = ref('');
    const sk = ref('');
    const address = ref('');

    const getDilithiumDescriptor = (addr) => {
      /*
        First Zond testnet address byte is 0x02, but mainnet address byte is 0x01
    */
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
      const hashedKey = new SHAKE(256);
      hashedKey.update(Buffer.from(pkToHash));
      let hashedKeyDigest = hashedKey.digest({ buffer: Buffer.alloc(32), encoding: 'hex' });
      hashedKeyDigest = hashedKeyDigest.slice(hashedKeyDigest.length - addressSize + 1);
      for (let i = 0; i < hashedKeyDigest.length; i++) {
        addr[i + 1] = hashedKeyDigest[i];
      }
      return addr;
    };

    const randomBytes = (size) => {
      const array = new Uint8Array(size);
      window.crypto.getRandomValues(array);
      return Buffer.from(array.buffer);
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
      // first convert hexstring to binary
      const binaryString = hexString
        .match(/.{1,2}/g)
        .map((byte) => String.fromCharCode(parseInt(byte, 16)))
        .join('');
      // then convert binary to base64
      const b = btoa(binaryString);
      // and split into 64 character lines
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
      // return false if not hex
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

    const generateKeypair = async (useRandom) => {
      const pkGen = new Uint8Array(CryptoPublicKeyBytes);
      const skGen = new Uint8Array(CryptoSecretKeyBytes);
      let seed = null;
      if (useRandom) {
        seed = randomBytes(48);
        cryptoSignKeypair(seed, pkGen, skGen);
      } else {
        if (hexseed.value.length !== 96) {
          return;
        }
        seed = Buffer.from(hexseed.value, 'hex');
        cryptoSignKeypair(seed, pkGen, skGen);
      }
      const hashedSeed = new SHAKE(256);
      hashedSeed.update(seed);
      const seedBuf = hashedSeed.digest({ buffer: Buffer.alloc(32) });
      cryptoSignKeypair(seedBuf, pkGen, skGen);
      pk.value = Buffer.from(pkGen).toString('hex');
      sk.value = Buffer.from(skGen).toString('hex');
      hexseed.value = Buffer.from(seed).toString('hex');
      const addrBytes = getDilithiumAddressFromPK(pkGen);
      // console.log(addrBytes);
      address.value = Buffer.from(addrBytes).toString('hex');
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
h4 > small {
  font-size: 1.1rem;
  color: #4aafff;
}
</style>
