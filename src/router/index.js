import { createRouter, createWebHistory } from 'vue-router';
import { Buffer } from 'buffer';
import HomeView from '../views/HomeView.vue';

// Polyfills for Dilithium5 library:
globalThis.Buffer = Buffer;

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Verify',
      component: HomeView,
    },
    {
      path: '/keypair',
      name: 'keypair',
      component: () => import('../views/KeypairView.vue'),
    },
    {
      path: '/sign',
      name: 'sign',
      component: () => import('../views/SignView.vue'),
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutView.vue'),
    },
  ],
});

export default router;
