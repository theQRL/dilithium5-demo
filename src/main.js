import { createApp } from 'vue';
import { createPinia } from 'pinia';

import App from './App.vue';
import router from './router/index.js';

import './index.scss';

import 'bootstrap/dist/js/bootstrap.js';

const app = createApp(App);

app.use(createPinia());
app.use(router);

app.mount('#app');
