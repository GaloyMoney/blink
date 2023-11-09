describe("Consent integration Test", () => {
  const signInData = {
    EMAIL: "test@galoy.io",
  }

  before(() => {
    cy.visit("/api/auth/signin")
  })

  it("Consent integration", () => {
    cy.contains("button", "Sign in with Blink").click()
    const email = signInData.EMAIL
    cy.wait(2000)
    cy.get("[data-testid=email_id_input]").type(email)
    cy.get("[data-testid=email_login_next_btn]").click()
    cy.getOTP(email).then((otp) => {
      const code = otp
      cy.wait(2000)
      cy.get("[data-testid=verification_code_input]").type(code)

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
})
