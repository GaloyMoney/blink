import { testData } from "../support/test-data"

describe("Withdraw link", () => {
  beforeEach(() => {
    cy.viewport(1920, 1080)
    cy.loginViaEmail(testData.EMAIL)
  })

  it("Create Withhdraw Link", () => {
    cy.visit("/")

    cy.get('[data-testid="create-link"]')
      .should("exist")
      .should("be.visible")
      .should("not.be.disabled")
      .click()

    cy.get('[data-testid="numpad-btn-5"]')
      .should("exist")
      .should("be.visible")
      .should("not.be.disabled")
      .click()

    cy.get('[data-testid="create-voucher-btn"]')
      .should("exist")
      .should("be.visible")
      .should("not.be.disabled")
      .click()

    cy.get('[data-testid="wallet-select"]')
      .should("exist")
      .should("be.visible")
      .should("not.be.disabled")
      .select("usd")

    cy.get('[data-testid="pay-voucher-amount-btn"]')
      .should("exist")
      .should("be.visible")
      .should("not.be.disabled")
      .click()

    cy.get('[data-testid="reveal-voucher-btn"]')
      .should("exist")
      .should("be.visible")
      .should("not.be.disabled")
      .click()

    cy.get('[data-testid="voucher-secret"]')
      .should("exist")
      .should("be.visible")
      .should("not.be.disabled")
      .invoke("text")
      .should((text) => {
        const pattern = /^[123456789ABCDEFGHIJKLMNPQRSTUVWXYZabcdefghjkmnpqrtuvwxyz]/
        expect(text).to.match(pattern)
      })

    cy.get('[data-testid="voucher-amount-detail"]')
      .should("exist")
      .should("be.visible")
      .should("not.be.disabled")
      .should("have.text", "$4.95")

    cy.get('[data-testid="voucher-id-code-detail"]')
      .should("exist")
      .should("be.visible")
      .should("not.be.disabled")
      .invoke("text")
      .should((text) => {
        const pattern = /^[123456789ABCDEFGHIJKLMNPQRSTUVWXYZabcdefghjkmnpqrtuvwxyz]{6}$/
        expect(text).to.match(pattern)
      })
  })
})
