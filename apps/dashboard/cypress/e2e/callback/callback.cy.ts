import { testData } from "../../support/test-data"

describe("Callback Test", () => {
  let callbackId: string | undefined

  beforeEach(() => {
    cy.viewport(1920, 1080)
    cy.setCookie("next-auth.session-token", testData.NEXT_AUTH_SESSION_TOKEN, {
      secure: true,
    })
    cy.visit("/")

    cy.get("[data-testid=sidebar-callback-link]").should("exist")
    cy.get("[data-testid=sidebar-callback-link]").should("be.visible")
    cy.get("[data-testid=sidebar-callback-link]").should("not.be.disabled")
    cy.get("[data-testid=sidebar-callback-link]").click()
  })

  it("Callback Addition Test", () => {
    cy.get("[data-testid=add-callback-btn]").should("exist")
    cy.get("[data-testid=add-callback-btn]").should("be.visible")
    cy.get("[data-testid=add-callback-btn]").should("not.be.disabled")
    cy.get("[data-testid=add-callback-btn]").click()

    cy.get("[data-testid=add-callback-input]").should("exist")
    cy.get("[data-testid=add-callback-input]").should("be.visible")
    cy.get("[data-testid=add-callback-input]").should("not.be.disabled")
    cy.get("[data-testid=add-callback-input]").type(testData.CALLBACK_URL)

    cy.get("[data-testid=add-callback-create-btn]").should("exist")
    cy.get("[data-testid=add-callback-create-btn]").should("be.visible")
    cy.get("[data-testid=add-callback-create-btn]").should("not.be.disabled")
    cy.get("[data-testid=add-callback-create-btn]").click()

    cy.contains("td", testData.CALLBACK_URL)
      .should("exist")
      .parent("tr")
      .invoke("attr", "data-testid")
      .then((id) => {
        callbackId = id
        cy.log("Callback ID:", id)
      })
  })

  it("Callback Deletion Test", () => {
    expect(callbackId).to.exist
    cy.get(`[data-testid="delete-callback-btn-${callbackId}"]`)
      .filter(":visible")
      .should("exist")
    cy.get(`[data-testid="delete-callback-btn-${callbackId}"]`)
      .filter(":visible")
      .should("be.visible")
    cy.get(`[data-testid="delete-callback-btn-${callbackId}"]`)
      .filter(":visible")
      .should("not.be.disabled")
    cy.get(`[data-testid="delete-callback-btn-${callbackId}"]`).filter(":visible").click()

    cy.get(`[data-testid="delete-callback-confirm-btn-${callbackId}"]`)
      .filter(":visible")
      .should("exist")
    cy.get(`[data-testid="delete-callback-confirm-btn-${callbackId}"]`)
      .filter(":visible")
      .should("be.visible")
    cy.get(`[data-testid="delete-callback-confirm-btn-${callbackId}"]`)
      .filter(":visible")
      .should("not.be.disabled")
    cy.get(`[data-testid="delete-callback-confirm-btn-${callbackId}"]`)
      .filter(":visible")
      .click()

    cy.get(`[data-testid="${callbackId}"]`).should("not.exist")
  })
})
