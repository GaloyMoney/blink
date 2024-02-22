import { testData } from "../../support/test-data"

describe("Callback Test", () => {
  beforeEach(() => {
    cy.viewport(1920, 1080)
    cy.setCookie("next-auth.session-token", testData.NEXT_AUTH_SESSION_TOKEN, {
      secure: true,
    })
    cy.visit("/")
    cy.get("[data-testid=sidebar-api-keys-link]").should("exist")
    cy.get("[data-testid=sidebar-api-keys-link]").should("be.visible")
    cy.get("[data-testid=sidebar-api-keys-link]").should("not.be.disabled")
    cy.get("[data-testid=sidebar-api-keys-link]").click()
  })

  it("Api Key creation Test", () => {
    cy.get('[data-testid="create-api-add-btn"]').should("exist")
    cy.get('[data-testid="create-api-add-btn"]').should("be.visible")
    cy.get('[data-testid="create-api-add-btn"]').should("not.be.disabled")
    cy.get('[data-testid="create-api-add-btn"]').click()

    cy.get('[data-testid="create-api-name-input"]').should("exist")
    cy.get('[data-testid="create-api-name-input"]').should("be.visible")
    cy.get('[data-testid="create-api-name-input"]').should("not.be.disabled")
    cy.get('[data-testid="create-api-name-input"]').type("New API Key")

    cy.get('[data-testid="create-api-expire-select"]').should("exist")
    cy.get('[data-testid="create-api-expire-select"]').should("be.visible")
    cy.get('[data-testid="create-api-expire-select"]').should("not.be.disabled")
    cy.get('[data-testid="create-api-expire-select"]').click()

    cy.get('[data-testid="create-api-expire-30-days-select"]').should("exist")
    cy.get('[data-testid="create-api-expire-30-days-select"]').should("be.visible")
    cy.get('[data-testid="create-api-expire-30-days-select"]').should("not.be.disabled")
    cy.get('[data-testid="create-api-expire-30-days-select"]').click()

    cy.get('[data-testid="read-scope-checkbox"]').should("exist")
    cy.get('[data-testid="read-scope-checkbox"]').should("be.visible")
    cy.get('[data-testid="read-scope-checkbox"]').should("not.be.disabled")
    cy.get('[data-testid="read-scope-checkbox"]').click()

    cy.get('[data-testid="create-api-create-btn"]').should("exist")
    cy.get('[data-testid="create-api-create-btn"]').should("be.visible")
    cy.get('[data-testid="create-api-create-btn"]').should("not.be.disabled")
    cy.get('[data-testid="create-api-create-btn"]').click()

    cy.get('[data-testid="create-api-close-btn"]').should("exist")
    cy.get('[data-testid="create-api-close-btn"]').should("be.visible")
    cy.get('[data-testid="create-api-close-btn"]').should("not.be.disabled")
    cy.get('[data-testid="create-api-close-btn"]').click()
  })
})
