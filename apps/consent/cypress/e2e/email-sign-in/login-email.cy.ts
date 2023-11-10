import { testData } from "../../support/test-config"

describe("Account ID Test", () => {
  let login_challenge: string | null

  before(() => {
    cy.visit(testData.AUTHORIZATION_URL)
    cy.url().then((currentUrl) => {
      const urlObj = new URL(currentUrl)
      login_challenge = urlObj.searchParams.get("login_challenge")
      if (!login_challenge) {
        throw new Error("login_challenge is null")
      }
    })
  })

  it("Login email Test", () => {
    cy.log("login challenge : ", login_challenge)
    const email = testData.EMAIL
    cy.get("[data-testid=email_id_input]")
      .should("exist")
      .and("be.visible")
      .and("not.be.disabled")
      .type(email)
    cy.get("[data-testid=email_login_next_btn]").should("exist").and("be.visible").click()
    cy.getOTP(email).then((otp) => {
      const code = otp
      cy.get("[data-testid=verification_code_input]")
        .should("exist")
        .and("be.visible")
        .and("not.be.disabled")
        .type(code)
      cy.get("[data-testid=submit_consent_btn]").should("exist").and("be.visible").click()
    })
  })
})
