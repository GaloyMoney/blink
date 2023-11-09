import { testData } from "../../support/test-data"

describe("Callback Test", () => {
  beforeEach(() => {
    cy.setCookie("next-auth.session-token", testData.NEXT_AUTH_SESSION_TOKEN, {
      secure: true,
    })
    cy.visit("/")

    cy.get("[data-testid=sidebar-api-keys-link]").click()
  })

  it("Api Key creation Test", () => {
    cy.get('[data-testid="create-api-add-btn"]').click()
    cy.get('[data-testid="create-api-name-input"]').type("New API Key")
    cy.get('[data-testid="create-api-expire-select"]').click()
    cy.get('[data-testid="create-api-expire-30-days-select"]').click()
    cy.get('[data-testid="create-api-create-btn"]').click()
    cy.get('[data-testid="create-api-close-btn"]').click()
  })
})
