import { testData } from "../../support/test-data"

describe("Callback Test", () => {
  let callbackId: string | undefined

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
  })

  it("Callback Addition Test", () => {
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
      .then((id) => {
        callbackId = id // Store the callback ID
        cy.log("Callback ID:", callbackId)
      })
  })

  it("Callback Deletion Test", () => {
    expect(callbackId).to.exist // Ensure the callback ID is available
    cy.get(`[data-testid="delete-callback-btn-${callbackId}"]`)
      .filter(":visible")
      .should("exist")
      .and("be.visible")
      .and("not.be.disabled")
      .click()

    cy.get(`[data-testid="delete-callback-confirm-btn-${callbackId}"]`)
      .filter(":visible")
      .should("exist")
      .and("be.visible")
      .and("not.be.disabled")
      .click()

    cy.get(`[data-testid="${callbackId}"]`).should("not.exist")
  })
})
