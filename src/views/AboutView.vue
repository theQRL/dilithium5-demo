<template>
  <main class="view-enter">
    <div class="about-page stagger">
      <div class="section-label">Post-Quantum Cryptography</div>
      <h1 class="about-title">Dilithium 5</h1>
      <p class="about-lead">from the QRL team</p>

      <div class="about-grid">
        <div class="about-card">
          <div class="about-card__icon">&#9919;</div>
          <div class="about-card__title">Verify</div>
          <div class="about-card__desc">Check the integrity of Dilithium digital signatures against public keys</div>
        </div>
        <div class="about-card">
          <div class="about-card__icon">&#128273;</div>
          <div class="about-card__title">Keypair</div>
          <div class="about-card__desc">Generate Dilithium 5 keypairs with quantum-resistant security</div>
        </div>
        <div class="about-card">
          <div class="about-card__icon">&#9998;</div>
          <div class="about-card__title">Sign</div>
          <div class="about-card__desc">Create digital signatures for files using your private key</div>
        </div>
      </div>

      <div class="about-text">
        <p>This is a demo of Dilithium 5, a post-quantum digital signature scheme. Dilithium is one of the algorithms selected by NIST for post-quantum standardization, designed to remain secure against attacks from quantum computers.</p>
        <p>This app runs entirely in your browser — no keys or files leave your device.</p>
      </div>
    </div>
  </main>
</template>

<style scoped>
.about-title {
  font-size: 2.8rem;
  font-weight: 400;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
  letter-spacing: -0.02em;
}

.about-lead {
  font-family: var(--mono);
  font-size: 0.85rem;
  color: var(--amber);
  letter-spacing: 0.04em;
  margin-bottom: 2.5rem;
}

.about-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 2.5rem;
}

.about-card {
  background: var(--surface-1);
  border: 1px solid var(--surface-3);
  border-radius: var(--radius);
  padding: 1.5rem;
  transition: border-color 0.2s ease;
}

.about-card:hover {
  border-color: var(--amber-dim);
}

.about-card__icon {
  font-size: 1.6rem;
  margin-bottom: 0.75rem;
  opacity: 0.7;
}

.about-card__title {
  font-family: var(--mono);
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.about-card__desc {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

.about-text {
  max-width: 600px;
}

.about-text p {
  font-size: 0.92rem;
  color: var(--text-secondary);
  line-height: 1.65;
  margin-bottom: 1rem;
}

@media (max-width: 600px) {
  .about-grid {
    grid-template-columns: 1fr;
  }
  .about-title {
    font-size: 2rem;
  }
}
</style>
