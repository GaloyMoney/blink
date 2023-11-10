import { testData } from "../../support/test-data"

describe("Callback Test", () => {
  beforeEach(() => {
    cy.viewport(1920, 1080)
    cy.setCookie("next-auth.session-token", testData.NEXT_AUTH_SESSION_TOKEN, {
      secure: true,
    })
    cy.visit("/")
    cy.get("[data-testid=sidebar-callback-link]")
      .should("exist")
      .and("be.visible")
      .and("not.be.disabled")
      .click()
    cy.get("[data-testid=add-callback-btn]")
      .should("exist")
      .and("be.visible")
      .and("not.be.disabled")
      .click()
    cy.get("[data-testid=add-callback-input]")
      .should("exist")
      .and("be.visible")
      .and("not.be.disabled")
      .type(testData.CALLBACK_URL)
    cy.get("[data-testid=add-callback-create-btn]")
      .should("exist")
      .and("be.visible")
      .and("not.be.disabled")
      .click()

    cy.contains("td", testData.CALLBACK_URL)
      .should("exist")
      .parent("tr")
      .invoke("attr", "data-testid")
      .as("callbackId")
  })

  it("Callback Addition Test", () => {
    cy.get("@callbackId")
      .should("exist")
      .then((id) => {
        cy.log("Callback ID:", id)
      })
  })

  it("Callback Deletion Test", () => {
    cy.get("@callbackId")
      .should("exist")
      .then((id) => {
        cy.get(`[data-testid="delete-callback-btn-${id}"]`)
          .filter(":visible")
          .should("exist")
          .and("be.visible")
          .and("not.be.disabled")
          .click()
        cy.get(`[data-testid="delete-callback-confirm-btn-${id}"]`)
          .filter(":visible")
          .should("exist")
          .and("be.visible")
          .and("not.be.disabled")
          .click()
        cy.get(`[data-testid="${id}"]`).should("not.exist")
      })
  })
})
