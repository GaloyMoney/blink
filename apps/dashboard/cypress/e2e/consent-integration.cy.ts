describe("Consent integration Test", () => {
  const signInData = {
    PHONE_NUMBER: "+16505554350",
    VERIFICATION_CODE: "000000",
  }

  before(() => {
    cy.visit("/api/auth/signin")
  })

  it("Consent integration", () => {
    cy.contains("button", "Sign in with Blink").click()
    cy.wait(2000)
    cy.get("[data-testid=sign_in_with_phone_text]").click()
    cy.get("[data-testid=phone_number_input]").type(signInData.PHONE_NUMBER)
    cy.get("[data-testid=phone_login_next_btn]").click()
    cy.get("[data-testid=verification_code_input]").type(signInData.VERIFICATION_CODE)
    cy.wait(2000)

    cy.contains("label", "offline").click()
    cy.contains("label", "transactions:read").click()
    cy.contains("label", "payments:send").click()

    cy.get("[data-testid=submit_consent_btn]").click()
    cy.wait(5000)
    cy.getCookie("next-auth.session-token").then((cookie) => {
      if (cookie && cookie.value) {
        cy.writeFile(".env.test", `NEXT_AUTH_SESSION_TOKEN=${cookie.value}\n`, {
          flag: "w",
        })
        cy.log("Session token saved to .env.test")
      } else {
        cy.log("Session token not found")
      }
    })
  })
})
