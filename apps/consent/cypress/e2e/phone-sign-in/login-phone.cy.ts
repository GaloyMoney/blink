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

  it("Verification Test", () => {
    cy.log("login challenge : ", login_challenge)
    cy.wait(2000)
    cy.get("[data-testid=sign_in_with_phone_text]").click()
    cy.get("[data-testid=phone_number_input]").type(testData.PHONE_NUMBER)
    cy.get("[data-testid=phone_login_next_btn]").click()

    //testing if captcha comes up will need to add geetest Vars
    // cy.get(".geetest_holder.geetest_mobile.geetest_ant.geetest_embed").should(
    //   "exist"
    // );

    // ---------------------
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
    cy.wait(2000)
    cy.get("[data-testid=verification_code_input]").type(testData.VERIFICATION_CODE)
    cy.get("[data-testid=submit_consent_btn]").click()
  })
})
