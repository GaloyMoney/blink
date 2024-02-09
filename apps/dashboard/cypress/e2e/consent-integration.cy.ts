describe("Consent integration Test", () => {
  const signInData = {
    EMAIL: "test@galoy.io",
  }

  before(() => {
    cy.flushRedis()
    cy.visit("/api/auth/signin")
    cy.wait(2000)
  })

  it("Consent integration", () => {
    cy.contains("button", "Sign in with Blink").should("exist")
    cy.contains("button", "Sign in with Blink").should("be.visible")
    cy.contains("button", "Sign in with Blink").should("not.be.disabled")
    cy.contains("button", "Sign in with Blink").click()

    const email = signInData.EMAIL
    cy.get("[data-testid=email_id_input]").should("exist")
    cy.get("[data-testid=email_id_input]").should("be.visible")
    cy.get("[data-testid=email_id_input]").should("not.be.disabled")
    cy.get("[data-testid=email_id_input]").type(email)

    cy.get("[data-testid=email_login_next_btn]").should("exist")
    cy.get("[data-testid=email_login_next_btn]").should("be.visible")
    cy.get("[data-testid=email_login_next_btn]").should("not.be.disabled")
    cy.get("[data-testid=email_login_next_btn]").click()

    cy.getOTP(email).then((otp) => {
      const code = otp
      cy.get("[data-testid=verification_code_input]").should("exist")
      cy.get("[data-testid=verification_code_input]").should("be.visible")
      cy.get("[data-testid=verification_code_input]").should("not.be.disabled")
      cy.get("[data-testid=verification_code_input]").type(code)

      cy.contains("label", "read").should("exist")
      cy.contains("label", "read").should("be.visible")
      cy.contains("label", "read").should("not.be.disabled")
      cy.contains("label", "read").should("not.be.disabled")
      cy.contains("label", "read").click()

      cy.contains("label", "write").should("exist")
      cy.contains("label", "write").should("be.visible")
      cy.contains("label", "write").should("not.be.disabled")
      cy.contains("label", "write").click()

      cy.get("[data-testid=submit_consent_btn]").should("exist")
      cy.get("[data-testid=submit_consent_btn]").should("be.visible")
      cy.get("[data-testid=submit_consent_btn]").should("not.be.disabled")
      cy.get("[data-testid=submit_consent_btn]").click()

      cy.url().should("eq", Cypress.config().baseUrl + "/")
      cy.getCookie("next-auth.session-token").then((cookie) => {
        if (cookie && cookie.value) {
          cy.writeFile(
            "../../dev/.envs/next-auth-session.env",
            `NEXT_AUTH_SESSION_TOKEN=${cookie.value}\n`,
            {
              flag: "w",
            },
          )
          cy.log("Session token saved to next-auth-session.test")
        } else {
          cy.log("Session token not found")
        }
      })
    })
  })
})
