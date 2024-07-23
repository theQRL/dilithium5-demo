<script setup></script>

<template>
  <main>
    <div class="container">
      <div class="row text-center">
        <div class="col">
          <span v-if="filelistKey.length === 0" class="text-muted">❗Key&nbsp;&nbsp;</span>
          <span v-if="filelist.length === 0" class="text-muted">❗File&nbsp;&nbsp;</span>
          <span v-if="filelistKey.length !== 0 && filelist.length !== 0" class="text-muted">
            ✅ Ready&nbsp;&nbsp;
          </span>
          <button
            v-if="filelistKey.length !== 0 && filelist.length !== 0"
            class="btn btn-success"
            :disabled="filelistKey.length === 0 || filelist.length === 0"
            @click="validateFiles(filelistKey, filelist)"
          >
            Start
          </button>
        </div>
      </div>

      <div class="container-fluid text-center mt-5" @dragover="dragover" @dragleave="dragleave" @drop="dropKey">
        <input
          id="assetsFieldHandleKey"
          ref="fileKey"
          type="file"
          name="fields[assetsFieldHandleKey][]"
          class="d-none"
          accept="*.*"
          @change="onChangeKey"
        />

        <label
          v-if="filelistKey.length === 0"
          for="assetsFieldHandleKey"
          class="p-3 pt-5 pb-5 border border-primary bg-light cursor-pointer"
        >
          <div>
            Drop private key file or
            <span class="underline">click here</span> to select
          </div>
        </label>
        <div v-if="keyError">ERROR: Invalid key format</div>
        <div class="container">
          <div v-if="filelistKey.length !== 0" v-cloak class="container row mt-4">
            <div v-for="file in filelistKey" :key="file" class="col-sm-6 mx-auto">
              <div class="card mb-3">
                <div class="card-body">
                  <div class="card-subtitle text-muted">Private Key file:</div>
                  <div class="card-title">
                    {{ file.name }}<br />
                    <span class="text-success">✅ Valid private key file</span>
                  </div>
                  <div class="card-body">
                    <button
                      type="button"
                      title="Remove file"
                      class="btn btn-danger btn-sm"
                      @click="removeKey(filelistKey.indexOf(file))"
                    >
                      Remove &times;
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="container-fluid text-center mt-5" @dragover="dragover" @dragleave="dragleave" @drop="drop">
        <input
          id="assetsFieldHandle"
          ref="file"
          type="file"
          multiple
          name="fields[assetsFieldHandle][]"
          class="d-none"
          accept="*.*"
          @change="onChange"
        />

        <label for="assetsFieldHandle" class="p-3 pt-5 pb-5 border border-primary bg-light cursor-pointer">
          <div>
            Drop file(s) to sign or
            <span class="underline">click here</span> to select
          </div>
        </label>
        <div class="container">
          <div v-if="filelist.length && ready === filelist.length" v-cloak class="container row mt-4">
            <div v-for="file in filelist" :key="file" class="col-sm-6">
              <div
                class="card mb-3"
                :class="{
                  'bg-success': verification[filelist.indexOf(file)] === true,
                  'bg-danger': verification[filelist.indexOf(file)] === false,
                }"
              >
                <div class="card-body">
                  <div class="card-subtitle text-muted">
                    <span v-if="verification[filelist.indexOf(file)] === 'error'">Error</span>
                  </div>
                  <div class="card-title">{{ file.name }}</div>
                  <div class="card-body">
                    <span v-if="verification[filelist.indexOf(file)] === null">Pending signing</span>
                    <span v-if="verification[filelist.indexOf(file)] === true">Signed</span>
                    <span v-if="verification[filelist.indexOf(file)] === false">FAILED verification</span>
                    <span v-if="verification[filelist.indexOf(file)] === 'error'">No valid signature found</span>
                    <div></div>
                    <button
                      type="button"
                      title="Remove file"
                      class="btn btn-danger btn-sm"
                      @click="remove(filelist.indexOf(file))"
                    >
                      Remove &times;
                    </button>
                    <button
                      v-if="verification[filelist.indexOf(file)] !== null"
                      type="button"
                      title="View signature"
                      class="btn btn-secondary btn-sm mx-1"
                      @click="view(filelist.indexOf(file))"
                    >
                      View signature
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
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
            <button type="button" class="btn btn-light" @click="activeResult = false">Close</button>
            <button type="button" class="btn btn-secondary" @click="copyToClipboard">Copy to clipboard</button>
            <button type="button" class="btn btn-primary" @click="downloadSig()">Download</button>
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
      // convert first 64 bytes of reader to string

      // check if file beings with "DILITHIUM PRIVATE KEY" identifier
      if (Buffer.from(reader.result.slice(0, 37)).toString() === '-----BEGIN DILITHIUM PRIVATE KEY-----') {
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
      // The file's binary content is available in reader.result
      resolve(reader.result);
    };

    reader.onerror = (error) => {
      reject(error);
    };

    // Read the file as an ArrayBuffer
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
    };
  },
  methods: {
    async validateFiles(key, files) {
      // first load key into a Buffer
      let keyBuffer = await readFileAsText(key[0]);
      // strip first and last line from keyBuffer
      keyBuffer = keyBuffer.split('\n').slice(1, -1).join('\n');
      // replace all newlines in keyBuffer
      keyBuffer = keyBuffer.replace(/\n/g, '');
      // convert keyBuffer to hexstring from base64
      keyBuffer = Buffer.from(keyBuffer, 'base64').toString('hex');
      files.forEach(async (file, index) => {
        const fileBuffer = await readBinaryFile(file);
        const msg = Buffer.from(fileBuffer);
        const sk = Buffer.from(keyBuffer, 'hex');
        let sig = cryptoSign(msg, sk);
        // get first 4595 bytes of sig (since this returns SIGNATURE + MESSAGE)
        sig = Buffer.from(sig).slice(0, 4595).toString('hex');
        this.verification[index] = sig;
      });
    },
    checkCanValidate() {
      // redundant function to check if we can validate
      // trigger to *sign* is via the "Start" button
      // (as signing might take a while, user should trigger)
    },
    async onChange() {
      const fl = [...this.$refs.file.files];
      Object.keys(fl).forEach(async () => {
        // const file = fl[i];
        this.ready += 1;
        this.verification.push(null);
      });
      this.filelist = [...fl, ...this.filelist];
      this.verification = new Array(this.filelist.length).fill(null);
      this.checkCanValidate();
    },
    async onChangeSig() {
      const fl = [...this.$refs.fileSig.files];
      // Object.keys(fl).forEach(async (i) => {
      //   const file = fl[i];
      // });
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
      // remove item from FileList
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
      // remove item from FileList
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
    dragover(event) {
      event.preventDefault();
      if (!event.currentTarget.classList.contains('bg-success')) {
        event.currentTarget.classList.add('bg-success');
      }
    },
    dragleave(event) {
      event.currentTarget.classList.remove('bg-success');
    },
    drop(event) {
      event.preventDefault();
      this.$refs.file.files = event.dataTransfer.files;
      this.onChange();
      event.currentTarget.classList.remove('bg-success');
    },
    dropKey(event) {
      event.preventDefault();
      this.$refs.fileKey.files = event.dataTransfer.files;
      this.onChangeKey();
      event.currentTarget.classList.remove('bg-success');
    },
    dropSig(event) {
      event.preventDefault();
      this.$refs.fileSig.files = event.dataTransfer.files;
      this.onChangeSig();
      event.currentTarget.classList.remove('bg-success');
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
<style scoped>
.results-TA {
  height: 200px;
  width: 100%;
}
</style>
