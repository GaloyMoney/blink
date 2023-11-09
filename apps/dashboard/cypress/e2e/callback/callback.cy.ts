import { testData } from "../../support/test-data"

describe("Callback Test", () => {
  beforeEach(() => {
    cy.setCookie("next-auth.session-token", testData.NEXT_AUTH_SESSION_TOKEN, {
      secure: true,
    })
    cy.visit("/")

    cy.get("[data-testid=sidebar-callback-link]").click()
    cy.get("[data-testid=add-callback-btn]").click()
    cy.get("[data-testid=add-callback-input]").type(testData.CALLBACK_URL)
    cy.get("[data-testid=add-callback-create-btn]").click()

    cy.contains("td", testData.CALLBACK_URL)
      .should("exist")
      .parent("tr")
      .invoke("attr", "data-testid")
      .as("callbackId")
  })

  it("Callback Addition Test", () => {
    cy.wait(2000)
    cy.get("@callbackId")
      .should("exist")
      .then((id) => {
        cy.log("Callback ID:", id)
      })
  })

  it("Callback Deletion Test", () => {
    cy.wait(2000)
    cy.get("@callbackId")
      .should("exist")
      .then((id) => {
        cy.get(`[data-testid="delete-callback-btn-${id}"]`).filter(":visible").click()
        cy.get(`[data-testid="delete-callback-confirm-btn-${id}"]`)
          .filter(":visible")
          .click()
        cy.wait(500)
        cy.get(`[data-testid="${id}"]`).should("not.exist")
      })
  })
})
