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
  })

  it("Verification Test", () => {
    cy.log("login challenge : ", login_challenge)

    cy.get("[data-testid=sign_in_with_phone_btn]").should("exist")
    cy.get("[data-testid=sign_in_with_phone_btn]").should("be.visible")
    cy.get("[data-testid=sign_in_with_phone_btn]").click()

    cy.get("[data-testid=phone_number_input]").should("exist")
    cy.get("[data-testid=phone_number_input]").should("be.visible")
    cy.get("[data-testid=phone_number_input]").should("not.be.disabled")
    cy.get("[data-testid=phone_number_input]").type(testData.PHONE_NUMBER)

    cy.get("[data-testid=phone_login_next_btn]").should("exist")
    cy.get("[data-testid=phone_login_next_btn]").should("be.visible")
    cy.get("[data-testid=phone_login_next_btn]").should("not.be.disabled")
    cy.get("[data-testid=phone_login_next_btn]").click()

    if (!login_challenge) {
      throw new Error("login_challenge does not found")
    }

    const cookieValue = JSON.stringify({
      loginType: "Phone",
      value: testData.PHONE_NUMBER,
      remember: false,
    })
    cy.setCookie(login_challenge, cookieValue, { secure: true })
    cy.visit(`/login/verification?login_challenge=${login_challenge}`)

    cy.get("[data-testid=verification_code_input]").should("exist")
    cy.get("[data-testid=verification_code_input]").should("be.visible")
    cy.get("[data-testid=verification_code_input]").should("not.be.disabled")
    cy.get("[data-testid=verification_code_input]").type(testData.VERIFICATION_CODE)

    cy.get("[data-testid=submit_consent_btn]").should("exist")
    cy.get("[data-testid=submit_consent_btn]").should("be.visible")
    cy.get("[data-testid=submit_consent_btn]").should("not.be.disabled")
    cy.get("[data-testid=submit_consent_btn]").click()
  })
})
