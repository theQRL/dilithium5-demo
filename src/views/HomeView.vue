<script setup></script>

<template>
  <main>
    <div class="container">
      <div class="row text-center">
        <div class="col">
          <span class="text-muted" v-if="filelistKey.length === 0">❗Key&nbsp;&nbsp;</span>
          <span class="text-muted" v-if="filelistSig.length === 0">❗Signature&nbsp;&nbsp;</span>
          <span class="text-muted" v-if="filelist.length === 0">❗File&nbsp;&nbsp;</span>
          <span class="text-muted"
            v-if="(filelistKey.length !== 0 && filelistSig.length !== 0 && filelist.length !== 0)">
            ✅ Ready&nbsp;&nbsp;
          </span>
          <!--
            <button class="btn btn-success btn-sm" @click="validateFiles(filelistKey, filelistSig, filelist)"
              :disabled="(filelistKey.length === 0 || filelistSig.length === 0 || filelist.length === 0)">
              Start
            </button>
          -->
        </div>
      </div>

      <div class="container-fluid text-center m-5" @dragover="dragover" @dragleave="dragleave" @drop="dropKey">
        <input id="assetsFieldHandleKey" ref="fileKey" type="file" name="fields[assetsFieldHandleKey][]" class="d-none"
          accept="*.*" @change="onChangeKey" />

        <label v-if="filelistKey.length === 0" for="assetsFieldHandleKey"
          class="p-3 pt-5 pb-5 border border-primary bg-light cursor-pointer">
          <div>
            Drop public key file or
            <span class="underline">click here</span> to select
          </div>
        </label>
        <div v-if="keyError">ERROR: Invalid key format</div>
        <div class="container">
          <div v-if="filelistKey.length !== 0" v-cloak class="container row mt-4">
            <div v-for="file in filelistKey" :key="file" class="col-sm-6 mx-auto">
              <div class="card mb-3">
                <div class="card-body">
                  <div class="card-subtitle text-muted">
                    Public Key file:
                  </div>
                  <div class="card-title">
                    {{ file.name }}<br />
                    <span class="text-success">✅ Valid public key file</span>
                  </div>
                  <div class="card-body">
                    <button type="button" title="Remove file" class="btn btn-danger btn-sm"
                      @click="removeKey(filelistKey.indexOf(file))">
                      Remove &times;
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="container-fluid text-center m-5" @dragover="dragover" @dragleave="dragleave" @drop="dropSig">
        <input id="assetsFieldHandleSig" ref="fileSig" type="file" name="fields[assetsFieldHandleSig][]" class="d-none"
          accept="*.*" @change="onChangeSig" />

        <label v-if="filelistSig.length === 0" for="assetsFieldHandleSig"
          class="p-3 pt-5 pb-5 border border-primary bg-light cursor-pointer">
          <div>
            Drop signature file or
            <span class="underline">click here</span> to select
          </div>
        </label>

        <div class="container">
          <div v-if="filelistSig.length !== 0" v-cloak class="container row mt-4">
            <div v-for="file in filelistSig" :key="file" class="col-sm-6 mx-auto">
              <div class="card mb-3">
                <div class="card-body">
                  <div class="card-subtitle text-muted">
                    Signature file:
                  </div>
                  <div class="card-title">{{ file.name }}</div>
                  <div class="card-body">
                    <button type="button" title="Remove file" class="btn btn-danger btn-sm"
                      @click="removeSig(filelistSig.indexOf(file))">
                      Remove &times;
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="container-fluid text-center m-5" @dragover="dragover" @dragleave="dragleave" @drop="drop">
        <input id="assetsFieldHandle" ref="file" type="file" multiple name="fields[assetsFieldHandle][]" class="d-none"
          accept="*.*" @change="onChange" />

        <label for="assetsFieldHandle" class="p-3 pt-5 pb-5 border border-primary bg-light cursor-pointer">
          <div>
            Drop file(s) to validate or
            <span class="underline">click here</span> to select
          </div>
        </label>
        <div class="container">
          <div v-if="filelist.length && ready === filelist.length" v-cloak class="container row mt-4">
            <div v-for="file in filelist" :key="file" class="col-sm-6">
              <div class="card mb-3"
                :class="{ 'bg-success': (verification[filelist.indexOf(file)] === true), 'bg-danger': (verification[filelist.indexOf(file)] === false) }">
                <div class="card-body">
                  <div class="card-subtitle text-muted">
                    <span v-if="(verification[filelist.indexOf(file)] === 'error')">Error</span>
                  </div>
                  <div class="card-title">{{ file.name }}</div>
                  <div class="card-body">
                    <span v-if="(verification[filelist.indexOf(file)] === null)">Pending verification</span>
                    <span v-if="(verification[filelist.indexOf(file)] === true) ">PASSED verification</span>
                    <span v-if="(verification[filelist.indexOf(file)] === false) ">FAILED verification</span>
                    <span v-if="(verification[filelist.indexOf(file)] === 'error') ">No signature found</span>
                    <div></div>
                    <button type="button" title="Remove file" class="btn btn-danger btn-sm"
                      @click="remove(filelist.indexOf(file))">
                      Remove &times;
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </main>
</template>

<script>
import {
  CryptoPublicKeyBytes,
  CryptoSecretKeyBytes,
  cryptoSignVerify,
} from '@theqrl/dilithium5';

const readFileAsText = (inputFile) => {
  const temporaryFileReader = new FileReader();

  return new Promise((resolve, reject) => {
    temporaryFileReader.onerror = () => {
      temporaryFileReader.abort();
      reject(new DOMException("Problem parsing input file."));
    };

    temporaryFileReader.onload = () => {
      resolve(temporaryFileReader.result);
    };
    temporaryFileReader.readAsText(inputFile);
  });
};

function readFileAsync(file) {
  return new Promise((resolve, reject) => {
    let reader = new FileReader();

    reader.onload = () => {
      // convert first 64 bytes of reader to string

      // check if file beings with "DILITHIUM PUBLIC KEY" identifier
      if (Buffer.from(reader.result.slice(0, 36)).toString() === '-----BEGIN DILITHIUM PUBLIC KEY-----') {
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
      filelistSig: [],
      ready: 0,
      keyError: false,
      verification: [],
      canValidate: false,
    };
  },
  methods: {
    async validateFiles(key, sig, files) {
      // first load key into a Buffer
      let keyBuffer = await readFileAsText(key[0]);
      // strip first and last line from keyBuffer
      keyBuffer = keyBuffer.split('\n').slice(1, -1).join('\n');
      // replace all newlines in keyBuffer
      keyBuffer = keyBuffer.replace(/\n/g, '');
      // convert keyBuffer to hexstring from base64
      keyBuffer = Buffer.from(keyBuffer, 'base64').toString('hex');
      // now signature into a Buffer
      const sigBuffer = await readFileAsText(sig[0]);
      // parse sigBuffer to get the signatures as a string
      const sigString = sigBuffer.toString();
      // split sigString into array of signatures
      const sigArray = sigString.split('\n');
      // const verification = new Array(files.length).fill(false);
      files.forEach(async (file, index) => {
        const fileBuffer = await readBinaryFile(file);
        const msg = Buffer.from(fileBuffer);
        const pk = Buffer.from(keyBuffer, 'hex');
        sigArray.forEach(async (sig) => {
          // sig contains a dilithium signature and a filename... split by a space
          const [signature, filename] = sig.split(' ');
          if (signature.length === 9190 && filename.length > 0) {
            if (file.name === filename) {
              // now we need to verify the signature
              // first we need to load the file into a buffer
              const fileBuffer = await readBinaryFile(file);
              // console.log('fileBuffer: ', fileBuffer);
              // now verify the signature
              console.log('doing verification for ', file.name)
              const sig = Buffer.from(signature, 'hex');
              // convert filebuffer (arraybuffer) to msg (hexstring)
              const msg = Buffer.from(fileBuffer);
              const pk = Buffer.from(keyBuffer, 'hex');
              const verified = cryptoSignVerify(sig, msg, pk);
              console.log('verified: ', verified);
              if (verified === true) {
                this.verification[index] = true;
              } else {
                this.verification[index] = false;
              }
            }
          }
        });
      });
      // will need to loop again and if no verification boolean (this.verification[index] === null) set an error
      files.forEach((file, index) => {
        if (this.verification[index] === null) {
          this.verification[index] = 'error';
        }
      });
    },
    checkCanValidate() {
      if (this.filelist.length > 0 && this.filelistSig.length > 0 && this.filelistKey.length > 0) {
        this.canValidate = true;
        this.validateFiles(this.filelistKey, this.filelistSig, this.filelist)
      } else {
        this.canValidate = false;
      }
    },
    async onChange() {
      const fl = [...this.$refs.file.files];
      Object.keys(fl).forEach(async (i) => {
        const file = fl[i];
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
      let that = this;
      Object.keys(fl).forEach(async (i) => {
        const file = fl[i];
        const validKey = await readFileAsync(file);
        if (!validKey) {
          this.removeKey(i);
          keyError = true;
          that.keyError = true
        } else {
          keyError = false;
          that.keyError = false;
        }
      });
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
      // remove item from FileList
      let dt = new DataTransfer();
      let x = Array.from(this.$refs.fileKey.files);
      x.splice(i, 1);
      x.forEach((file) => { dt.items.add(file); });
      this.$refs.fileKey.files = dt.files;
      this.verification = new Array(this.filelist.length).fill(null);
      this.checkCanValidate();
    },
    removeSig(i) {
      this.filelistSig.splice(i, 1);
      // remove item from FileList
      let dt = new DataTransfer();
      let x = Array.from(this.$refs.fileSig.files);
      x.splice(i, 1);
      x.forEach((file) => { dt.items.add(file); });
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
  },
};
</script>