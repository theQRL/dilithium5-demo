<script setup></script>

<template>
  <main class="view-enter">
    <div class="stagger">
      <div class="d-flex align-items-center justify-content-between mb-4">
        <div>
          <div class="section-label">Digital Signatures</div>
          <h1 class="section-title mb-0">Sign Files</h1>
        </div>
        <div class="d-flex align-items-center gap-3">
          <div class="status-bar">
            <span
              class="status-bar__dot"
              :class="{
                'status-bar__dot--warning': filelistKey.length === 0 || filelist.length === 0,
                'status-bar__dot--ready': filelistKey.length !== 0 && filelist.length !== 0,
              }"
            ></span>
            <span v-if="filelistKey.length === 0 || filelist.length === 0">
              <span v-if="filelistKey.length === 0">Key</span>
              <span v-if="filelist.length === 0">&nbsp;File</span>
              &mdash; needed
            </span>
            <span v-else>Ready</span>
          </div>
          <button
            v-if="filelistKey.length !== 0 && filelist.length !== 0"
            class="btn-action btn-action--success"
            @click="validateFiles(filelistKey, filelist)"
          >
            Sign Files
          </button>
        </div>
      </div>

      <!-- Private Key Drop -->
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
          <span class="drop-zone__icon">&#128273;</span>
          Drop <strong>private key</strong> file or click to select
        </div>
        <div v-else>
          <div v-for="file in filelistKey" :key="file" class="file-card file-card--success">
            <div class="file-card__meta">Private Key</div>
            <div class="file-card__name">{{ file.name }}</div>
            <div class="file-card__status file-card__status--pass">Valid private key</div>
            <div class="mt-2">
              <button class="btn-action btn-action--danger" @click.stop="removeKey(filelistKey.indexOf(file))">Remove</button>
            </div>
          </div>
        </div>
      </div>
      <div v-if="keyError" class="error-msg mb-4">Invalid key format — must be a Dilithium private key PEM file</div>

      <!-- Files to Sign Drop -->
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
          Drop <strong>file(s)</strong> to sign or click to select
        </div>
      </div>

      <!-- Signing Results -->
      <div v-if="filelist.length && ready === filelist.length" class="row g-3 mt-2">
        <div v-for="file in filelist" :key="file" class="col-sm-6">
          <div
            class="file-card"
            :class="{
              'file-card--success': verification[filelist.indexOf(file)] && verification[filelist.indexOf(file)] !== true && verification[filelist.indexOf(file)] !== false && verification[filelist.indexOf(file)] !== 'error',
              'file-card--danger': verification[filelist.indexOf(file)] === false,
            }"
          >
            <div class="file-card__meta">
              <span v-if="verification[filelist.indexOf(file)] === 'error'">Error</span>
              <span v-else>File</span>
            </div>
            <div class="file-card__name">{{ file.name }}</div>
            <div class="file-card__status" :class="{
              'file-card__status--pending': verification[filelist.indexOf(file)] === null,
              'file-card__status--pass': verification[filelist.indexOf(file)] && verification[filelist.indexOf(file)] !== true && verification[filelist.indexOf(file)] !== false && verification[filelist.indexOf(file)] !== 'error',
              'file-card__status--fail': verification[filelist.indexOf(file)] === false || verification[filelist.indexOf(file)] === 'error',
            }">
              <span v-if="verification[filelist.indexOf(file)] === null">Pending</span>
              <span v-if="verification[filelist.indexOf(file)] && verification[filelist.indexOf(file)] !== true && verification[filelist.indexOf(file)] !== false && verification[filelist.indexOf(file)] !== 'error'">Signed</span>
              <span v-if="verification[filelist.indexOf(file)] === false">Failed</span>
              <span v-if="verification[filelist.indexOf(file)] === 'error'">No valid signature</span>
            </div>
            <div class="mt-2 d-flex gap-2">
              <button class="btn-action btn-action--danger" @click="remove(filelist.indexOf(file))">Remove</button>
              <button
                v-if="verification[filelist.indexOf(file)] !== null"
                class="btn-action btn-action--blue"
                @click="view(filelist.indexOf(file))"
              >
                View Signature
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div
      ref="modalResult"
      class="modal"
      :class="{ show: activeResult, 'd-block': activeResult }"
      tabindex="-1"
      role="dialog"
    >
      <div :class="{ show: activeResult, 'd-block': activeResult }" class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">Signature for {{ filename }}</div>
          <div class="modal-body">
            <textarea ref="textToCopy" v-model="compiledString" class="results-TA" readonly></textarea>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn-action" @click="activeResult = false">Close</button>
            <button type="button" class="btn-action btn-action--blue" @click="copyToClipboard">Copy</button>
            <button type="button" class="btn-action btn-action--primary" @click="downloadSig()">Download</button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="activeResult" class="modal-backdrop fade show"></div>
  </main>
</template>

<script>
import { cryptoSign } from '@theqrl/dilithium5';

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
      const header = new TextDecoder().decode(new Uint8Array(reader.result.slice(0, 37)));
      if (header === '-----BEGIN DILITHIUM PRIVATE KEY-----') {
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
      ready: 0,
      activeResult: false,
      keyError: false,
      verification: [],
      canValidate: false,
      compiledString: '',
      filename: '',
      dragStates: { key: false, files: false },
    };
  },
  methods: {
    async validateFiles(key, files) {
      let keyText = await readFileAsText(key[0]);
      keyText = keyText.split('\n').slice(1, -1).join('\n');
      keyText = keyText.replace(/\n/g, '');
      const keyBytes = Uint8Array.from(atob(keyText), (c) => c.charCodeAt(0));
      files.forEach(async (file, index) => {
        const fileBuffer = await readBinaryFile(file);
        const msg = new Uint8Array(fileBuffer);
        let sig = cryptoSign(msg, keyBytes, false);
        sig = Array.from(sig.slice(0, 4595))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');
        this.verification[index] = sig;
      });
    },
    checkCanValidate() {
      // signing is user-triggered via "Start" button
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
    view(i) {
      this.activeResult = true;
      this.compiledString = this.verification[i];
      this.filename = this.filelist[i].name;
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
    dropFiles(event) {
      this.dragStates.files = false;
      this.$refs.file.files = event.dataTransfer.files;
      this.onChange();
    },
    dropSig(event) {
      this.$refs.fileSig.files = event.dataTransfer.files;
      this.onChangeSig();
    },
    async copyToClipboard() {
      const shareData = {
        title: 'QRL Dilithium',
        text: this.compiledString,
        url: 'https://dilithium.theqrl.org',
      };
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Could not copy -- trying clipboard fallback');
        this.$refs.textToCopy.focus();
        this.$refs.textToCopy.select();
        document.execCommand('copy');
      }
    },
    downloadSig() {
      const sigData = `${this.compiledString} ${this.filename}\n`;
      const binBlob = new Blob([sigData]);
      const a = window.document.createElement('a');
      a.href = window.URL.createObjectURL(binBlob, {
        type: 'text/plain',
      });
      a.download = `${this.filename}.sig`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    },
  },
};
</script>
