import { testData } from "../../support/test-config"

describe("Account ID Test", () => {
  let login_challenge: string | null

  before(() => {
    cy.flushRedis()
    cy.visit(testData.AUTHORIZATION_URL)
    cy.url().then((currentUrl) => {
      const urlObj = new URL(currentUrl)
      login_challenge = urlObj.searchParams.get("login_challenge")
      if (!login_challenge) {
        throw new Error("login_challenge is null")
      }
    })
    cy.wait(2000)
  })

  it("Login email Test", () => {
    cy.log("login challenge : ", login_challenge)
    const email = testData.EMAIL

    cy.get("[data-testid=email_id_input]").should("exist")
    cy.get("[data-testid=email_id_input]").should("be.visible")
    cy.get("[data-testid=email_id_input]").should("not.be.disabled")
    cy.get("[data-testid=email_id_input]").type(email)

    cy.get("[data-testid=email_login_next_btn]").should("exist")
    cy.get("[data-testid=email_login_next_btn]").should("be.visible")
    cy.get("[data-testid=email_login_next_btn]").click()

    cy.getOTP(email).then((otp) => {
      const code = otp

      cy.get("[data-testid=verification_code_input]").should("exist")
      cy.get("[data-testid=verification_code_input]").should("be.visible")
      cy.get("[data-testid=verification_code_input]").should("not.be.disabled")
      cy.get("[data-testid=verification_code_input]").type(code)

      cy.get("[data-testid=submit_consent_btn]").should("exist")
      cy.get("[data-testid=submit_consent_btn]").should("be.visible")
      cy.get("[data-testid=submit_consent_btn]").should("not.be.disabled")
      cy.get("[data-testid=submit_consent_btn]").click()
    })
  })
})
