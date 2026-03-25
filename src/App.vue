<script setup>
import { RouterLink, RouterView } from 'vue-router';
</script>

<template>
  <header class="app-header">
    <nav class="app-nav">
      <a class="app-brand" href="/">
        <img src="./assets/yellow.svg" height="44" class="app-brand__logo" />
        <span class="app-brand__sub">Dilithium 5</span>
      </a>

      <div class="app-nav__links">
        <RouterLink class="app-nav__link" to="/">Verify</RouterLink>
        <RouterLink class="app-nav__link" to="/keypair">Keypair</RouterLink>
        <RouterLink class="app-nav__link" to="/sign">Sign</RouterLink>
        <RouterLink class="app-nav__link" to="/about">About</RouterLink>
      </div>
    </nav>
  </header>

  <main class="app-main">
    <RouterView></RouterView>
  </main>
</template>

<style lang="scss" scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(10, 10, 12, 0.85);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--surface-3);
}

.app-nav {
  max-width: 960px;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
}

.app-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
}

.app-brand__logo {
  height: 36px;
}

.app-brand__sub {
  font-family: var(--mono);
  font-size: 0.7rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-dim);
}

.app-nav__links {
  display: flex;
  align-items: center;
  gap: 0;
}

.app-nav__link {
  position: relative;
  padding: 0.5rem 1.1rem;
  font-family: var(--mono);
  font-size: 0.75rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  text-decoration: none;
  color: var(--text-secondary);
  transition: color 0.2s ease;
}

.app-nav__link:hover {
  color: var(--text-primary);
}

.app-nav__link::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 1.1rem;
  right: 1.1rem;
  height: 2px;
  background: var(--amber);
  transform: scaleX(0);
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.app-nav__link:hover::after {
  transform: scaleX(1);
}

.app-nav__link.router-link-active {
  color: var(--text-primary);
}

.app-nav__link.router-link-active::after {
  transform: scaleX(1);
}

.app-main {
  max-width: 960px;
  margin: 0 auto;
  padding: 3rem 1.5rem 4rem;
}

@media (max-width: 600px) {
  .app-nav__link {
    padding: 0.5rem 0.6rem;
    font-size: 0.68rem;
  }
  .app-brand__sub {
    display: none;
  }
}
</style>
