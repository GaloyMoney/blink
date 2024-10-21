import { testData } from "../support/test-config"

describe("Account ID Test", () => {
  before(() => {
    cy.flushRedis()
    cy.visit(testData.AUTHORIZATION_URL)
    cy.location("search").should((search) => {
      const params = new URLSearchParams(search)
      expect(params.has("login_challenge")).to.be.true
    })
  })

  it("Login email Test", () => {
    const email = testData.EMAIL

    cy.get("[data-testid=sign_in_with_phone_btn]")
      .should("exist")
      .should("be.visible")
      .click()

    cy.get("[data-testid=sign_in_with_email_btn]")
      .should("exist")
      .should("be.visible")
      .click()

    cy.get("[data-testid=email_id_input]")
      .should("exist")
      .should("be.visible")
      .should("not.be.disabled")
      .type(email)

    cy.get("[data-testid=email_login_next_btn]")
      .should("exist")
      .should("be.visible")
      .click()

    cy.getOTP(email).then((code) => {
      cy.get("[data-testid=verification_code_input]")
        .should("exist")
        .should("be.visible")
        .should("not.be.disabled")
        .type(code)

      cy.get("[data-testid=submit_consent_btn]")
        .should("exist")
        .should("be.visible")
        .should("not.be.disabled")
    })
  })
})
