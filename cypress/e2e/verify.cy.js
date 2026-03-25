describe('Verify Page', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('should show initial UI with three upload areas', () => {
    cy.contains('Drop public key file').should('be.visible')
    cy.contains('Drop signature file').should('be.visible')
    cy.contains('Drop file(s) to validate').should('be.visible')
  })

  it('should show status indicators for missing inputs', () => {
    cy.contains('span', 'Key').should('be.visible')
    cy.contains('span', 'Signature').should('be.visible')
    cy.contains('span', 'File').should('be.visible')
  })

  it('should accept a valid public key file', () => {
    cy.fixture('test.public', 'binary').then((content) => {
      const blob = Cypress.Blob.binaryStringToBlob(content, 'application/octet-stream')
      const file = new File([blob], 'test.public', { type: 'application/octet-stream' })
      const dt = new DataTransfer()
      dt.items.add(file)

      cy.get('input#assetsFieldHandleKey').then(($input) => {
        $input[0].files = dt.files
        $input[0].dispatchEvent(new Event('change', { bubbles: true }))
      })
    })

    cy.contains('Valid public key file', { timeout: 5000 }).should('be.visible')
    cy.contains('test.public').should('be.visible')
  })

  it('should show error for invalid public key file', () => {
    const content = 'not a valid public key'
    const blob = new Blob([content], { type: 'text/plain' })
    const file = new File([blob], 'bad.key', { type: 'text/plain' })
    const dt = new DataTransfer()
    dt.items.add(file)

    cy.get('input#assetsFieldHandleKey').then(($input) => {
      $input[0].files = dt.files
      $input[0].dispatchEvent(new Event('change', { bubbles: true }))
    })

    cy.contains('ERROR: Invalid key format', { timeout: 5000 }).should('be.visible')
  })

  it('should accept a signature file', () => {
    cy.fixture('hello.txt.sig', 'binary').then((content) => {
      const blob = Cypress.Blob.binaryStringToBlob(content, 'application/octet-stream')
      const file = new File([blob], 'hello.txt.sig', { type: 'application/octet-stream' })
      const dt = new DataTransfer()
      dt.items.add(file)

      cy.get('input#assetsFieldHandleSig').then(($input) => {
        $input[0].files = dt.files
        $input[0].dispatchEvent(new Event('change', { bubbles: true }))
      })
    })

    cy.contains('hello.txt.sig', { timeout: 5000 }).should('be.visible')
  })

  it('should accept a file to verify', () => {
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
  })

  it('should verify a valid signature successfully', () => {
    // Upload public key
    cy.fixture('test.public', 'binary').then((content) => {
      const blob = Cypress.Blob.binaryStringToBlob(content, 'application/octet-stream')
      const file = new File([blob], 'test.public', { type: 'application/octet-stream' })
      const dt = new DataTransfer()
      dt.items.add(file)

      cy.get('input#assetsFieldHandleKey').then(($input) => {
        $input[0].files = dt.files
        $input[0].dispatchEvent(new Event('change', { bubbles: true }))
      })
    })

    cy.contains('Valid public key file', { timeout: 5000 })

    // Upload signature file
    cy.fixture('hello.txt.sig', 'binary').then((content) => {
      const blob = Cypress.Blob.binaryStringToBlob(content, 'application/octet-stream')
      const file = new File([blob], 'hello.txt.sig', { type: 'application/octet-stream' })
      const dt = new DataTransfer()
      dt.items.add(file)

      cy.get('input#assetsFieldHandleSig').then(($input) => {
        $input[0].files = dt.files
        $input[0].dispatchEvent(new Event('change', { bubbles: true }))
      })
    })

    cy.contains('hello.txt.sig', { timeout: 5000 })

    // Upload file to verify
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

    // Verification is triggered automatically when all three files are loaded
    cy.contains('PASSED verification', { timeout: 30000 }).should('be.visible')

    // Card should have success styling
    cy.get('.card.bg-success').should('exist')
  })

  it('should reject verification with wrong file content', () => {
    // Upload public key
    cy.fixture('test.public', 'binary').then((content) => {
      const blob = Cypress.Blob.binaryStringToBlob(content, 'application/octet-stream')
      const file = new File([blob], 'test.public', { type: 'application/octet-stream' })
      const dt = new DataTransfer()
      dt.items.add(file)

      cy.get('input#assetsFieldHandleKey').then(($input) => {
        $input[0].files = dt.files
        $input[0].dispatchEvent(new Event('change', { bubbles: true }))
      })
    })

    cy.contains('Valid public key file', { timeout: 5000 })

    // Upload signature file (signed for "Hello Dilithium\n")
    cy.fixture('hello.txt.sig', 'binary').then((content) => {
      const blob = Cypress.Blob.binaryStringToBlob(content, 'application/octet-stream')
      const file = new File([blob], 'hello.txt.sig', { type: 'application/octet-stream' })
      const dt = new DataTransfer()
      dt.items.add(file)

      cy.get('input#assetsFieldHandleSig').then(($input) => {
        $input[0].files = dt.files
        $input[0].dispatchEvent(new Event('change', { bubbles: true }))
      })
    })

    cy.contains('hello.txt.sig', { timeout: 5000 })

    // Upload a DIFFERENT file with the same name but different content
    const tamperedContent = 'This is not the original content'
    const blob = new Blob([tamperedContent], { type: 'text/plain' })
    const file = new File([blob], 'hello.txt', { type: 'text/plain' })
    const dt = new DataTransfer()
    dt.items.add(file)

    cy.get('input#assetsFieldHandle').then(($input) => {
      $input[0].files = dt.files
      $input[0].dispatchEvent(new Event('change', { bubbles: true }))
    })

    // Should fail verification
    cy.contains('FAILED verification', { timeout: 30000 }).should('be.visible')
    cy.get('.card.bg-danger').should('exist')
  })

  it('should show error when signature file has no match for uploaded file', () => {
    // Upload public key
    cy.fixture('test.public', 'binary').then((content) => {
      const blob = Cypress.Blob.binaryStringToBlob(content, 'application/octet-stream')
      const file = new File([blob], 'test.public', { type: 'application/octet-stream' })
      const dt = new DataTransfer()
      dt.items.add(file)

      cy.get('input#assetsFieldHandleKey').then(($input) => {
        $input[0].files = dt.files
        $input[0].dispatchEvent(new Event('change', { bubbles: true }))
      })
    })

    cy.contains('Valid public key file', { timeout: 5000 })

    // Upload signature file (has signature for "hello.txt")
    cy.fixture('hello.txt.sig', 'binary').then((content) => {
      const blob = Cypress.Blob.binaryStringToBlob(content, 'application/octet-stream')
      const file = new File([blob], 'hello.txt.sig', { type: 'application/octet-stream' })
      const dt = new DataTransfer()
      dt.items.add(file)

      cy.get('input#assetsFieldHandleSig').then(($input) => {
        $input[0].files = dt.files
        $input[0].dispatchEvent(new Event('change', { bubbles: true }))
      })
    })

    cy.contains('hello.txt.sig', { timeout: 5000 })

    // Upload a file with a different name (no matching signature)
    const content = 'some content'
    const blob = new Blob([content], { type: 'text/plain' })
    const file = new File([blob], 'other.txt', { type: 'text/plain' })
    const dt = new DataTransfer()
    dt.items.add(file)

    cy.get('input#assetsFieldHandle').then(($input) => {
      $input[0].files = dt.files
      $input[0].dispatchEvent(new Event('change', { bubbles: true }))
    })

    // Should show "No signature found" error since filename doesn't match
    cy.contains('No signature found', { timeout: 10000 }).should('be.visible')
  })

  it('should allow removing uploaded files', () => {
    // Upload public key
    cy.fixture('test.public', 'binary').then((content) => {
      const blob = Cypress.Blob.binaryStringToBlob(content, 'application/octet-stream')
      const file = new File([blob], 'test.public', { type: 'application/octet-stream' })
      const dt = new DataTransfer()
      dt.items.add(file)

      cy.get('input#assetsFieldHandleKey').then(($input) => {
        $input[0].files = dt.files
        $input[0].dispatchEvent(new Event('change', { bubbles: true }))
      })
    })

    cy.contains('Valid public key file', { timeout: 5000 })

    // Remove the key
    cy.contains('.card', 'test.public').find('button').contains('Remove').click()
    cy.contains('Drop public key file').should('be.visible')
  })
})
