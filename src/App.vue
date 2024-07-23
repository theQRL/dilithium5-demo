<script setup>
import { RouterLink, RouterView } from 'vue-router';
</script>

<template>
  <nav class="navbar navbar-expand-lg navbar-light bg-light">
    <a class="navbar-brand" href="/">
      <img src="./assets/yellow.svg" height="60" class="d-inline-block align-top" />
      <div class="sub">Dilithium 5</div>
    </a>

    <ul class="collapse navbar-collapse navbar-nav">
      <li class="nav-item">
        <RouterLink class="nav-link" to="/">Verify</RouterLink>
      </li>
      <li class="nav-item">
        <RouterLink class="nav-link" to="/keypair">Keypair</RouterLink>
      </li>
      <li class="nav-item">
        <RouterLink class="nav-link" to="/sign">Sign</RouterLink>
      </li>
      <li class="nav-item">
        <RouterLink class="nav-link" to="/about">About</RouterLink>
      </li>
    </ul>
  </nav>

  <nav class="navbar navbar-expand navbar-light bg-light d-lg-none">
    <ul class="navbar-nav">
      <li class="nav-item">
        <RouterLink class="nav-link" to="/">Verify</RouterLink>
      </li>
      <li class="nav-item">
        <RouterLink class="nav-link" to="/keypair">Keypair</RouterLink>
      </li>
      <li class="nav-item">
        <RouterLink class="nav-link" to="/sign">Sign</RouterLink>
      </li>
      <li class="nav-item">
        <RouterLink class="nav-link" to="/about">About</RouterLink>
      </li>
    </ul>
  </nav>
  <RouterView class="p-3 pt-5"></RouterView>
</template>
<style lang="scss" scoped>
.navbar {
  padding-bottom: 15px;
}
.nav-item {
  padding-left: 20px;
}
.nav-link {
  color: #fff;
  transition: opacity 0.3s ease-in-out, color 0.3s ease-in-out;
}

.nav-link:hover {
  color: #ffa729;
  transition: opacity 0.3s ease-in-out, color 0.3s ease-in-out;
}
.nav-link:focus {
  color: #fff;
  transition: opacity 0.3s ease-in-out, color 0.3s ease-in-out;
}
.router-link-active {
  color: #fff;
  border-bottom: 4px solid #4aafff;
  transition: opacity 0.3s ease-in-out, color 0.3s ease-in-out;
}
.router-link-active:hover {
  color: #ffa729;
}
.sub {
  font-size: 0.6em;
  margin-top: -18px;
  margin-left: 50px;
}
</style>
