import { testData } from "../../support/test-data"

describe("Withdraw link", () => {
  beforeEach(() => {
    cy.viewport(1920, 1080)
    cy.setCookie("next-auth.session-token", testData.NEXT_AUTH_SESSION_TOKEN, {
      secure: true,
    })
    cy.visit("/")
  })

  it("Create Withhdraw Link", () => {
    cy.get('[data-testid="create-link"]').should("exist")
    cy.get('[data-testid="create-link"]').should("be.visible")
    cy.get('[data-testid="create-link"]').should("not.be.disabled")
    cy.get('[data-testid="create-link"]').click()

    cy.get('[data-testid="numpad-btn-5"]').should("exist")
    cy.get('[data-testid="numpad-btn-5"]').should("be.visible")
    cy.get('[data-testid="numpad-btn-5"]').should("not.be.disabled")
    cy.get('[data-testid="numpad-btn-5"]').click()

    cy.get('[data-testid="create-voucher-btn"]').should("exist")
    cy.get('[data-testid="create-voucher-btn"]').should("be.visible")
    cy.get('[data-testid="create-voucher-btn"]').should("not.be.disabled")
    cy.get('[data-testid="create-voucher-btn"]').click()

    cy.get('[data-testid="wallet-select"]').should("exist")
    cy.get('[data-testid="wallet-select"]').should("be.visible")
    cy.get('[data-testid="wallet-select"]').should("not.be.disabled")
    cy.get('[data-testid="wallet-select"]').select("usd")

    cy.get('[data-testid="pay-voucher-amount-btn"]').should("exist")
    cy.get('[data-testid="pay-voucher-amount-btn"]').should("be.visible")
    cy.get('[data-testid="pay-voucher-amount-btn"]').should("not.be.disabled")
    cy.get('[data-testid="pay-voucher-amount-btn"]').click()

    cy.get('[data-testid="reveal-voucher-btn"]').should("exist")
    cy.get('[data-testid="reveal-voucher-btn"]').should("be.visible")
    cy.get('[data-testid="reveal-voucher-btn"]').should("not.be.disabled")
    cy.get('[data-testid="reveal-voucher-btn"]').click()

    cy.get('[data-testid="voucher-secret"]').should("exist")
    cy.get('[data-testid="voucher-secret"]').should("be.visible")
    cy.get('[data-testid="voucher-secret"]').should("not.be.disabled")
    cy.get('[data-testid="voucher-secret"]')
      .invoke("text")
      .should((text) => {
        const pattern =
          /^[123456789ABCDEFGHIJKLMNPQRSTUVWXYZabcdefghjkmnpqrtuvwxyz]/
        expect(text).to.match(pattern)
      })

    cy.get('[data-testid="voucher-amount-detail"]').should("exist")
    cy.get('[data-testid="voucher-amount-detail"]').should("be.visible")
    cy.get('[data-testid="voucher-amount-detail"]').should("not.be.disabled")
    cy.get('[data-testid="voucher-amount-detail"]').should(
      "have.text",
      "$5",
    )

    cy.get('[data-testid="voucher-id-code-detail"]').should("exist")
    cy.get('[data-testid="voucher-id-code-detail"]').should("be.visible")
    cy.get('[data-testid="voucher-id-code-detail"]').should("not.be.disabled")
    cy.get('[data-testid="voucher-id-code-detail"]')
      .invoke("text")
      .should((text) => {
        const pattern = /^[123456789ABCDEFGHIJKLMNPQRSTUVWXYZabcdefghjkmnpqrtuvwxyz]{6}$/
        expect(text).to.match(pattern)
      })
  })
})
