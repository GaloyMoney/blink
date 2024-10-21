import { testData } from "../support/test-data"

describe("Callback Test", () => {
  beforeEach(() => {
    // cy.viewport(1920, 1080)
    cy.loginViaEmail(testData.EMAIL)
  })

  it("Api Key creation Test", () => {
    cy.visit("/")

    cy.get("[data-testid=sidebar-api-keys-link]")
      .should("exist")
      .should("be.visible")
      .should("not.be.disabled")
      .click()

    cy.get('[data-testid="create-api-add-btn"]')
      .should("exist")
      .should("be.visible")
      .should("not.be.disabled")
      .click()

    cy.get('[data-testid="create-api-create-btn"]')
      .should("exist")
      .should("be.visible")
      .should("not.be.disabled")
      .click()

    cy.get('[data-testid="create-api-name-input"]')
      .should("exist")
      .should("be.visible")
      .should("not.be.disabled")
      .type("New API Key")

    cy.get('[data-testid="create-api-expire-select"]')
      .should("exist")
      .should("be.visible")
      .should("not.be.disabled")
      .click()

    cy.get('[data-testid="create-api-expire-30-days-select"]')
      .should("exist")
      .should("be.visible")
      .should("not.be.disabled")
      .click()

    cy.get('[data-testid="write-scope-checkbox"]')
      .should("exist")
      .should("be.visible")
      .should("not.be.disabled")
      .click()

    cy.get('[data-testid="create-api-create-btn"]')
      .should("exist")
      .should("be.visible")
      .should("not.be.disabled")
      .click()

    cy.get('[data-testid="create-api-close-btn"]')
      .should("exist")
      .should("be.visible")
      .should("not.be.disabled")
      .click()
  })
})
