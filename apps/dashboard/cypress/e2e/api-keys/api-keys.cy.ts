import { testData } from "../../support/test-data"

describe("Callback Test", () => {
  beforeEach(() => {
    cy.viewport(3000, 2000)
    cy.setCookie("next-auth.session-token", testData.NEXT_AUTH_SESSION_TOKEN, {
      secure: true,
    })
    cy.visit("/")
    cy.get("[data-testid=sidebar-api-keys-link]").click()
  })

  it("Api Key creation Test", () => {
    cy.wait(2000)
    cy.get('[data-testid="create-api-add-btn"]').click()
    cy.get('[data-testid="create-api-name-input"]').type("New API Key")
    cy.wait(2000)
    cy.get('[data-testid="create-api-expire-select"]').click()
    cy.get('[data-testid="create-api-expire-30-days-select"]').click()
    cy.wait(2000)
    cy.get('[data-testid="create-api-create-btn"]').click()
    cy.wait(2000)
    cy.get('[data-testid="create-api-close-btn"]').click()
  })
})
