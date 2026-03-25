<script setup></script>

<template>
  <main class="view-enter">
    <div class="stagger">
      <div class="d-flex align-items-center justify-content-between mb-4">
        <div>
          <div class="section-label">Signature Verification</div>
          <h1 class="section-title mb-0">Verify Files</h1>
        </div>
        <div class="status-bar">
          <span
            class="status-bar__dot"
            :class="{
              'status-bar__dot--warning': filelistKey.length === 0 || filelistSig.length === 0 || filelist.length === 0,
              'status-bar__dot--ready': filelistKey.length !== 0 && filelistSig.length !== 0 && filelist.length !== 0,
            }"
          ></span>
          <span v-if="filelistKey.length === 0 || filelistSig.length === 0 || filelist.length === 0">
            <span v-if="filelistKey.length === 0">Key</span>
            <span v-if="filelistSig.length === 0">&nbsp;Sig</span>
            <span v-if="filelist.length === 0">&nbsp;File</span>
            &mdash; needed
          </span>
          <span v-else>Ready</span>
        </div>
      </div>

      <!-- Public Key Drop -->
      <div
        class="drop-zone mb-4"
        :class="{ 'drag-active': dragStates.key }"
        @dragover.prevent="dragStates.key = true"
        @dragleave="dragStates.key = false"
        @drop.prevent="dropKey"
        @click="$refs.fileKey.click()"
      >
        <input
          ref="fileKey"
          type="file"
          class="d-none"
          accept="*.*"
          @change="onChangeKey"
        />
        <div v-if="filelistKey.length === 0" class="drop-zone__label text-center">
          <span class="drop-zone__icon">&#9919;</span>
          Drop <strong>public key</strong> file or click to select
        </div>
        <div v-else>
          <div v-for="file in filelistKey" :key="file" class="file-card file-card--success">
            <div class="file-card__meta">Public Key</div>
            <div class="file-card__name">{{ file.name }}</div>
            <div class="file-card__status file-card__status--pass">Valid public key</div>
            <div class="mt-2">
              <button class="btn-action btn-action--danger" @click.stop="removeKey(filelistKey.indexOf(file))">Remove</button>
            </div>
          </div>
        </div>
      </div>
      <div v-if="keyError" class="error-msg mb-4">Invalid key format — must be a Dilithium public key PEM file</div>

      <!-- Signature Drop -->
      <div
        class="drop-zone mb-4"
        :class="{ 'drag-active': dragStates.sig }"
        @dragover.prevent="dragStates.sig = true"
        @dragleave="dragStates.sig = false"
        @drop.prevent="dropSig"
        @click="$refs.fileSig.click()"
      >
        <input
          ref="fileSig"
          type="file"
          class="d-none"
          accept="*.*"
          @change="onChangeSig"
        />
        <div v-if="filelistSig.length === 0" class="drop-zone__label text-center">
          <span class="drop-zone__icon">&#9998;</span>
          Drop <strong>signature</strong> file or click to select
        </div>
        <div v-else>
          <div v-for="file in filelistSig" :key="file" class="file-card">
            <div class="file-card__meta">Signature</div>
            <div class="file-card__name">{{ file.name }}</div>
            <div class="mt-2">
              <button class="btn-action btn-action--danger" @click.stop="removeSig(filelistSig.indexOf(file))">Remove</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Files to Verify Drop -->
      <div
        class="drop-zone mb-4"
        :class="{ 'drag-active': dragStates.files }"
        @dragover.prevent="dragStates.files = true"
        @dragleave="dragStates.files = false"
        @drop.prevent="dropFiles"
        @click="$refs.file.click()"
      >
        <input
          ref="file"
          type="file"
          multiple
          class="d-none"
          accept="*.*"
          @change="onChange"
        />
        <div class="drop-zone__label text-center">
          <span class="drop-zone__icon">&#128196;</span>
          Drop <strong>file(s)</strong> to verify or click to select
        </div>
      </div>

      <!-- Verification Results -->
      <div v-if="filelist.length && ready === filelist.length" class="row g-3 mt-2">
        <div v-for="file in filelist" :key="file" class="col-sm-6">
          <div
            class="file-card"
            :class="{
              'file-card--success': verification[filelist.indexOf(file)] === true,
              'file-card--danger': verification[filelist.indexOf(file)] === false,
            }"
          >
            <div class="file-card__meta">
              <span v-if="verification[filelist.indexOf(file)] === 'error'">Error</span>
              <span v-else>Verification</span>
            </div>
            <div class="file-card__name">{{ file.name }}</div>
            <div class="file-card__status" :class="{
              'file-card__status--pending': verification[filelist.indexOf(file)] === null,
              'file-card__status--pass': verification[filelist.indexOf(file)] === true,
              'file-card__status--fail': verification[filelist.indexOf(file)] === false || verification[filelist.indexOf(file)] === 'error',
            }">
              <span v-if="verification[filelist.indexOf(file)] === null">Pending</span>
              <span v-if="verification[filelist.indexOf(file)] === true">Passed</span>
              <span v-if="verification[filelist.indexOf(file)] === false">Failed</span>
              <span v-if="verification[filelist.indexOf(file)] === 'error'">No signature found</span>
            </div>
            <div class="mt-2">
              <button class="btn-action btn-action--danger" @click="remove(filelist.indexOf(file))">Remove</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script>
import { cryptoSignVerify } from '@theqrl/dilithium5';

const readFileAsText = (inputFile) => {
  const temporaryFileReader = new FileReader();

  return new Promise((resolve, reject) => {
    temporaryFileReader.onerror = () => {
      temporaryFileReader.abort();
      reject(new DOMException('Problem parsing input file.'));
    };

    temporaryFileReader.onload = () => {
      resolve(temporaryFileReader.result);
    };
    temporaryFileReader.readAsText(inputFile);
  });
};

function readFileAsync(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const header = new TextDecoder().decode(new Uint8Array(reader.result.slice(0, 36)));
      if (header === '-----BEGIN DILITHIUM PUBLIC KEY-----') {
        resolve(true);
      } else {
        resolve(false);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

function readBinaryFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result);
    };

    reader.onerror = (error) => {
      reject(error);
    };

    reader.readAsArrayBuffer(file);
  });
}

export default {
  data() {
    return {
      filelist: [],
      filelistKey: [],
      filelistSig: [],
      ready: 0,
      keyError: false,
      verification: [],
      canValidate: false,
      dragStates: { key: false, sig: false, files: false },
    };
  },
  methods: {
    async validateFiles(key, sigFile, files) {
      const hexToBytes = (hex) => {
        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < hex.length; i += 2) {
          bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
        }
        return bytes;
      };
      let keyText = await readFileAsText(key[0]);
      keyText = keyText.split('\n').slice(1, -1).join('\n');
      if (keyText.split('\n')[keyText.split('\n').length - 1] === '-----END DILITHIUM PUBLIC KEY-----') {
        keyText = keyText.split('\n').slice(0, -1).join('\n');
      }
      keyText = keyText.replace(/\n/g, '');
      const keyBytes = Uint8Array.from(atob(keyText), (c) => c.charCodeAt(0));
      const sigText = await readFileAsText(sigFile[0]);
      const sigArray = sigText.split('\n');
      files.forEach(async (file, index) => {
        sigArray.forEach(async (sig) => {
          const signature = sig.split(' ')[0];
          const filename = sig
            .split(' ')
            .slice(1, sig.length - 1)
            .join(' ');
          if (signature.length === 9190 && filename.length > 0) {
            if (file.name === filename) {
              const fileBuffer = await readBinaryFile(file);
              const sigBytes = hexToBytes(signature);
              const msg = new Uint8Array(fileBuffer);
              const verified = cryptoSignVerify(sigBytes, msg, keyBytes);
              if (verified === true) {
                this.verification[index] = true;
              } else {
                this.verification[index] = false;
              }
            }
          }
        });
      });
      files.forEach((file, index) => {
        if (this.verification[index] === null) {
          this.verification[index] = 'error';
        }
      });
    },
    checkCanValidate() {
      if (this.filelist.length > 0 && this.filelistSig.length > 0 && this.filelistKey.length > 0) {
        this.canValidate = true;
        this.validateFiles(this.filelistKey, this.filelistSig, this.filelist);
      } else {
        this.canValidate = false;
      }
    },
    async onChange() {
      const fl = [...this.$refs.file.files];
      Object.keys(fl).forEach(async () => {
        this.ready += 1;
        this.verification.push(null);
      });
      this.filelist = [...fl, ...this.filelist];
      this.verification = new Array(this.filelist.length).fill(null);
      this.checkCanValidate();
    },
    async onChangeSig() {
      console.log('changing sig file');
      const fl = [...this.$refs.fileSig.files];
      this.filelistSig = [...fl];
      this.verification = new Array(this.filelist.length).fill(null);
      this.checkCanValidate();
    },
    async onChangeKey() {
      const fl = [...this.$refs.fileKey.files];
      let keyError = false;
      const that = this;
      Object.keys(fl).forEach(async (i) => {
        const file = fl[i];
        const validKey = await readFileAsync(file);
        if (!validKey) {
          this.removeKey(i);
          keyError = true;
          that.keyError = true;
        } else {
          keyError = false;
          that.keyError = false;
        }
      });
      this.keyError = keyError;
      this.verification = new Array(this.filelist.length).fill(null);
      this.filelistKey = [...fl];
      this.checkCanValidate();
    },
    remove(i) {
      this.filelist.splice(i, 1);
      this.ready -= 1;
      this.verification.splice(i, 1);
      this.checkCanValidate();
    },
    removeKey(i) {
      this.filelistKey.splice(i, 1);
      const dt = new DataTransfer();
      const x = Array.from(this.$refs.fileKey.files);
      x.splice(i, 1);
      x.forEach((file) => {
        dt.items.add(file);
      });
      this.$refs.fileKey.files = dt.files;
      this.verification = new Array(this.filelist.length).fill(null);
      this.checkCanValidate();
    },
    removeSig(i) {
      this.filelistSig.splice(i, 1);
      const dt = new DataTransfer();
      const x = Array.from(this.$refs.fileSig.files);
      x.splice(i, 1);
      x.forEach((file) => {
        dt.items.add(file);
      });
      this.$refs.fileSig.files = dt.files;
      this.verification = new Array(this.filelist.length).fill(null);
      this.checkCanValidate();
    },
    dropKey(event) {
      this.dragStates.key = false;
      this.$refs.fileKey.files = event.dataTransfer.files;
      this.onChangeKey();
    },
    dropSig(event) {
      this.dragStates.sig = false;
      this.$refs.fileSig.files = event.dataTransfer.files;
      this.onChangeSig();
    },
    dropFiles(event) {
      this.dragStates.files = false;
      this.$refs.file.files = event.dataTransfer.files;
      this.onChange();
    },
  },
};
</script>
