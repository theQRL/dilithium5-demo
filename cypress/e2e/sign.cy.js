describe('Sign Page', () => {
  beforeEach(() => {
    cy.visit('/sign')
  })

  it('should show initial UI with file upload areas', () => {
    cy.contains('Drop private key file').should('be.visible')
    cy.contains('Drop file(s) to sign').should('be.visible')
  })

  it('should show status indicators requiring key and file', () => {
    cy.contains('span', 'Key').should('be.visible')
    cy.contains('span', 'File').should('be.visible')
    cy.contains('button', 'Start').should('not.exist')
  })

  it('should accept a valid private key file', () => {
    cy.fixture('test.private', 'binary').then((content) => {
      const blob = Cypress.Blob.binaryStringToBlob(content, 'application/octet-stream')
      const file = new File([blob], 'test.private', { type: 'application/octet-stream' })
      const dt = new DataTransfer()
      dt.items.add(file)

      cy.get('input#assetsFieldHandleKey').then(($input) => {
        $input[0].files = dt.files
        $input[0].dispatchEvent(new Event('change', { bubbles: true }))
      })
    })

    cy.contains('Valid private key file', { timeout: 5000 }).should('be.visible')
    cy.contains('test.private').should('be.visible')
    cy.contains('button', 'Remove').should('be.visible')
  })

  it('should show error for invalid key file', () => {
    // Upload a non-PEM file as a key
    const content = 'this is not a valid key file'
    const blob = new Blob([content], { type: 'text/plain' })
    const file = new File([blob], 'invalid.key', { type: 'text/plain' })
    const dt = new DataTransfer()
    dt.items.add(file)

    cy.get('input#assetsFieldHandleKey').then(($input) => {
      $input[0].files = dt.files
      $input[0].dispatchEvent(new Event('change', { bubbles: true }))
    })

    cy.contains('ERROR: Invalid key format', { timeout: 5000 }).should('be.visible')
  })

  it('should accept a file to sign', () => {
    cy.fixture('hello.txt', 'binary').then((content) => {
      const blob = Cypress.Blob.binaryStringToBlob(content, 'application/octet-stream')
      const file = new File([blob], 'hello.txt', { type: 'application/octet-stream' })
      const dt = new DataTransfer()
      dt.items.add(file)

      cy.get('input#assetsFieldHandle').then(($input) => {
        $input[0].files = dt.files
        $input[0].dispatchEvent(new Event('change', { bubbles: true }))
      })
    })

    cy.contains('hello.txt', { timeout: 5000 }).should('be.visible')
    cy.contains('Pending signing').should('be.visible')
  })

  it('should show Ready and Start when both key and file are loaded', () => {
    // Upload private key
    cy.fixture('test.private', 'binary').then((content) => {
      const blob = Cypress.Blob.binaryStringToBlob(content, 'application/octet-stream')
      const file = new File([blob], 'test.private', { type: 'application/octet-stream' })
      const dt = new DataTransfer()
      dt.items.add(file)

      cy.get('input#assetsFieldHandleKey').then(($input) => {
        $input[0].files = dt.files
        $input[0].dispatchEvent(new Event('change', { bubbles: true }))
      })
    })

    cy.contains('Valid private key file', { timeout: 5000 })

    // Upload file to sign
    cy.fixture('hello.txt', 'binary').then((content) => {
      const blob = Cypress.Blob.binaryStringToBlob(content, 'application/octet-stream')
      const file = new File([blob], 'hello.txt', { type: 'application/octet-stream' })
      const dt = new DataTransfer()
      dt.items.add(file)

      cy.get('input#assetsFieldHandle').then(($input) => {
        $input[0].files = dt.files
        $input[0].dispatchEvent(new Event('change', { bubbles: true }))
      })
    })

    cy.contains('hello.txt', { timeout: 5000 })
    cy.contains('Ready').should('be.visible')
    cy.contains('button', 'Start').should('be.visible').and('not.be.disabled')
  })

  it('should sign a file and show the signature', () => {
    // Upload private key
    cy.fixture('test.private', 'binary').then((content) => {
      const blob = Cypress.Blob.binaryStringToBlob(content, 'application/octet-stream')
      const file = new File([blob], 'test.private', { type: 'application/octet-stream' })
      const dt = new DataTransfer()
      dt.items.add(file)

      cy.get('input#assetsFieldHandleKey').then(($input) => {
        $input[0].files = dt.files
        $input[0].dispatchEvent(new Event('change', { bubbles: true }))
      })
    })

    cy.contains('Valid private key file', { timeout: 5000 })

    // Upload file to sign
    cy.fixture('hello.txt', 'binary').then((content) => {
      const blob = Cypress.Blob.binaryStringToBlob(content, 'application/octet-stream')
      const file = new File([blob], 'hello.txt', { type: 'application/octet-stream' })
      const dt = new DataTransfer()
      dt.items.add(file)

      cy.get('input#assetsFieldHandle').then(($input) => {
        $input[0].files = dt.files
        $input[0].dispatchEvent(new Event('change', { bubbles: true }))
      })
    })

    cy.contains('button', 'Start', { timeout: 5000 }).click()

    // After signing, the "View signature" button appears (verification stores the hex string)
    cy.contains('button', 'View signature', { timeout: 30000 }).should('be.visible')

    // Click to view signature
    cy.contains('button', 'View signature').click()

    // Modal should appear with signature
    cy.get('.modal.show').should('be.visible')
    cy.get('.modal-header').should('contain', 'hello.txt')
    cy.get('textarea.results-TA')
      .invoke('val')
      .should('match', /^[0-9a-f]{9190}$/)

    // Modal should have Close and Download buttons
    cy.get('.modal').contains('button', 'Close').should('be.visible')
    cy.get('.modal').contains('button', 'Download').should('be.visible')

    // Close modal
    cy.get('.modal').contains('button', 'Close').click()
    cy.get('.modal.show').should('not.exist')
  })

  it('should produce a deterministic signature matching fixtures', () => {
    // Load the expected signature from fixture
    cy.fixture('hello.txt.sig').then((sigContent) => {
      const expectedSig = sigContent.split(' ')[0]

      // Upload private key
      cy.fixture('test.private', 'binary').then((keyContent) => {
        const blob = Cypress.Blob.binaryStringToBlob(keyContent, 'application/octet-stream')
        const file = new File([blob], 'test.private', { type: 'application/octet-stream' })
        const dt = new DataTransfer()
        dt.items.add(file)

        cy.get('input#assetsFieldHandleKey').then(($input) => {
          $input[0].files = dt.files
          $input[0].dispatchEvent(new Event('change', { bubbles: true }))
        })
      })

      cy.contains('Valid private key file', { timeout: 5000 })

      // Upload file to sign
      cy.fixture('hello.txt', 'binary').then((fileContent) => {
        const blob = Cypress.Blob.binaryStringToBlob(fileContent, 'application/octet-stream')
        const file = new File([blob], 'hello.txt', { type: 'application/octet-stream' })
        const dt = new DataTransfer()
        dt.items.add(file)

        cy.get('input#assetsFieldHandle').then(($input) => {
          $input[0].files = dt.files
          $input[0].dispatchEvent(new Event('change', { bubbles: true }))
        })
      })

      cy.contains('button', 'Start', { timeout: 5000 }).click()
      cy.contains('button', 'View signature', { timeout: 30000 }).should('be.visible')

      cy.contains('button', 'View signature').click()

      // The signature in the UI should exactly match the fixture
      cy.get('textarea.results-TA')
        .invoke('val')
        .should('eq', expectedSig)
    })
  })

  it('should allow removing a key file', () => {
    cy.fixture('test.private', 'binary').then((content) => {
      const blob = Cypress.Blob.binaryStringToBlob(content, 'application/octet-stream')
      const file = new File([blob], 'test.private', { type: 'application/octet-stream' })
      const dt = new DataTransfer()
      dt.items.add(file)

      cy.get('input#assetsFieldHandleKey').then(($input) => {
        $input[0].files = dt.files
        $input[0].dispatchEvent(new Event('change', { bubbles: true }))
      })
    })

    cy.contains('Valid private key file', { timeout: 5000 })
    cy.contains('button', 'Remove').click()

    // Should return to upload prompt
    cy.contains('Drop private key file').should('be.visible')
  })

  it('should allow removing a file to sign', () => {
    cy.fixture('hello.txt', 'binary').then((content) => {
      const blob = Cypress.Blob.binaryStringToBlob(content, 'application/octet-stream')
      const file = new File([blob], 'hello.txt', { type: 'application/octet-stream' })
      const dt = new DataTransfer()
      dt.items.add(file)

      cy.get('input#assetsFieldHandle').then(($input) => {
        $input[0].files = dt.files
        $input[0].dispatchEvent(new Event('change', { bubbles: true }))
      })
    })

    cy.contains('hello.txt', { timeout: 5000 })
    cy.get('.card').contains('button', 'Remove').click()

    // File card should be gone
    cy.contains('.card', 'hello.txt').should('not.exist')
  })
})
