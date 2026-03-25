describe('Navigation', () => {
  it('should load the app and show the navbar', () => {
    cy.visit('/')
    cy.get('nav.navbar').should('be.visible')
    cy.get('a.navbar-brand').should('contain', 'Dilithium 5')
  })

  it('should have all navigation links', () => {
    cy.visit('/')
    cy.get('nav a.nav-link').should('have.length.at.least', 4)
    cy.contains('a.nav-link', 'Verify')
    cy.contains('a.nav-link', 'Keypair')
    cy.contains('a.nav-link', 'Sign')
    cy.contains('a.nav-link', 'About')
  })

  it('should navigate to Keypair page', () => {
    cy.visit('/')
    cy.contains('a.nav-link', 'Keypair').first().click()
    cy.url().should('include', '/keypair')
    cy.contains('Generate new random keypair')
  })

  it('should navigate to Sign page', () => {
    cy.visit('/')
    cy.contains('a.nav-link', 'Sign').first().click()
    cy.url().should('include', '/sign')
    cy.contains('Drop private key file')
  })

  it('should navigate to About page', () => {
    cy.visit('/')
    cy.contains('a.nav-link', 'About').first().click()
    cy.url().should('include', '/about')
    cy.contains('Dilithium 5 demo')
    cy.contains('post-quantum signature scheme')
  })

  it('should navigate to Verify page (home)', () => {
    cy.visit('/about')
    cy.contains('a.nav-link', 'Verify').first().click()
    cy.url().should('not.include', '/about')
    cy.contains('Drop public key file')
  })

  it('should highlight active nav link', () => {
    cy.visit('/keypair')
    cy.contains('a.nav-link', 'Keypair').first().should('have.class', 'router-link-active')
  })
})
