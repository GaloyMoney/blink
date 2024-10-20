describe("Consent integration Test", () => {
  const signInData = {
    EMAIL: "test@galoy.io",
  }

  before(() => {
    cy.flushRedis()
    cy.visit("/api/auth/signin")
  })

  it("Consent integration", () => {
    cy.contains("button", "Sign in with Blink")
      .should("exist")
      .should("be.visible")
      .should("not.be.disabled")
      .click()

    cy.get("[data-testid=sign_in_with_phone_btn]")
      .should("exist")
      .should("be.visible")
      .click()

    cy.get("[data-testid=sign_in_with_email_btn]")
      .should("exist")
      .should("be.visible")
      .click()

    const email = signInData.EMAIL
    cy.get("[data-testid=email_id_input]")
      .should("exist")
      .should("be.visible")
      .should("be.enabled")
      .type(email)
      .should("have.value", email)

    cy.get("[data-testid=email_login_next_btn]")
      .should("exist")
      .should("be.visible")
      .should("not.be.disabled")
      .click()

    cy.getOTP(email).then((otp) => {
      const code = otp
      cy.get("[data-testid=verification_code_input]")
        .should("exist")
        .should("be.visible")
        .should("not.be.disabled")
        .type(code)

      cy.contains("label", "read")
        .should("exist")
        .should("be.visible")
        .should("not.be.disabled")
        .should("not.be.disabled")
        .click()

      cy.contains("label", "write")
        .should("exist")
        .should("be.visible")
        .should("not.be.disabled")
        .click()

      cy.get("[data-testid=submit_consent_btn]")
        .should("exist")
        .should("be.visible")
        .should("not.be.disabled")
        .click()

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
