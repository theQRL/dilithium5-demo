describe('Keypair Generation', () => {
  beforeEach(() => {
    cy.visit('/keypair')
  })

  it('should show initial UI with generate button and hexseed input', () => {
    cy.contains('button', 'Generate').should('be.visible')
    cy.contains('h4', 'Generate new random keypair')
    cy.contains('h4', 'Regenerate keypair from existing hexseed')
    cy.get('input[placeholder="Hexseed"]').should('be.visible')
  })

  it('should generate a random keypair', () => {
    cy.contains('h4', 'Generate new random keypair')
      .parent()
      .find('button')
      .contains('Generate')
      .click()

    // After generation, should show key outputs
    cy.contains('h5', 'Public key', { timeout: 15000 }).should('be.visible')
    cy.contains('h5', 'Secret key').should('be.visible')
    cy.contains('h4', 'ID/Address').should('be.visible')
    cy.contains('h5', 'Hexseed').should('be.visible')

    // Public key field should have a hex value (5184 hex chars = 2592 bytes)
    cy.contains('h5', 'Public key')
      .parent()
      .find('input')
      .invoke('val')
      .should('match', /^[0-9a-f]{5184}$/)

    // Secret key field should have a hex value (9792 hex chars = 4896 bytes)
    cy.contains('h5', 'Secret key')
      .parent()
      .find('input')
      .invoke('val')
      .should('match', /^[0-9a-f]{9792}$/)

    // Hexseed should be 96 hex chars (48 bytes)
    cy.contains('h5', 'Hexseed')
      .parent()
      .find('input')
      .invoke('val')
      .should('match', /^[0-9a-f]{96}$/)

    // Address should be 40 hex chars (20 bytes)
    cy.get('h4')
      .contains('ID/Address')
      .parent()
      .invoke('text')
      .should('match', /[0-9a-f]{40}/)
  })

  it('should show Reset button after generation and clear on click', () => {
    cy.contains('h4', 'Generate new random keypair')
      .parent()
      .find('button')
      .contains('Generate')
      .click()

    cy.contains('h5', 'Public key', { timeout: 15000 }).should('be.visible')

    // Reset button should be visible
    cy.contains('button', 'Reset').should('be.visible')
    // Generate button should not be visible
    cy.contains('h4', 'Generate new random keypair').should('not.exist')

    // Click reset
    cy.contains('button', 'Reset').click()

    // Should return to initial state
    cy.contains('h4', 'Generate new random keypair').should('be.visible')
    cy.get('input[placeholder="Hexseed"]').should('be.visible')
  })

  it('should show validation error for invalid hexseed', () => {
    cy.get('input[placeholder="Hexseed"]').type('notahexseed')
    cy.contains('Hexseed must be 96 hex characters long').should('be.visible')
  })

  it('should show validation error for too-short hexseed', () => {
    cy.get('input[placeholder="Hexseed"]').type('abcdef1234')
    cy.contains('Hexseed must be 96 hex characters long').should('be.visible')
  })

  it('should not show validation error when hexseed is empty', () => {
    cy.contains('Hexseed must be 96 hex characters long').should('not.exist')
  })

  it('should regenerate deterministic keypair from hexseed', () => {
    // A valid 96-char hex string (48 bytes)
    const hexseed = 'a'.repeat(96)

    cy.get('input[placeholder="Hexseed"]').type(hexseed)
    cy.contains('Hexseed must be 96 hex characters long').should('not.exist')

    // Click the Generate button next to the hexseed input
    cy.get('input[placeholder="Hexseed"]')
      .parent()
      .find('button')
      .contains('Generate')
      .click()

    // Wait for keypair generation
    cy.contains('h5', 'Public key', { timeout: 15000 }).should('be.visible')

    // Store PK value
    cy.contains('h5', 'Public key')
      .parent()
      .find('input')
      .invoke('val')
      .as('firstPk')

    // Reset and regenerate with same seed to verify determinism
    cy.contains('button', 'Reset').click()
    cy.get('input[placeholder="Hexseed"]').type(hexseed)
    cy.get('input[placeholder="Hexseed"]')
      .parent()
      .find('button')
      .contains('Generate')
      .click()

    cy.contains('h5', 'Public key', { timeout: 15000 }).should('be.visible')

    cy.get('@firstPk').then((firstPk) => {
      cy.contains('h5', 'Public key')
        .parent()
        .find('input')
        .invoke('val')
        .should('eq', firstPk)
    })
  })

  it('should have Copy and Download buttons for each field', () => {
    cy.contains('h4', 'Generate new random keypair')
      .parent()
      .find('button')
      .contains('Generate')
      .click()

    cy.contains('h5', 'Public key', { timeout: 15000 }).should('be.visible')

    // Each key section should have Copy and Download
    ;['Hexseed', 'Public key', 'Secret key'].forEach((label) => {
      cy.contains('h5', label)
        .parent()
        .find('button')
        .contains('Copy')
        .should('be.visible')
      cy.contains('h5', label)
        .parent()
        .find('button')
        .contains('Download')
        .should('be.visible')
    })

    // Address should have a Copy button
    cy.get('h4').contains('ID/Address').parent().find('button').contains('Copy').should('be.visible')
  })
})
