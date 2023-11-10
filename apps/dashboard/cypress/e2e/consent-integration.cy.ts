describe("Consent integration Test", () => {
  const signInData = {
    EMAIL: "test@galoy.io",
  }

  before(() => {
    cy.visit("/api/auth/signin")
  })

  it("Consent integration", () => {
    cy.contains("button", "Sign in with Blink")
      .should("exist")
      .and("be.visible")
      .and("not.be.disabled")
      .click()

    const email = signInData.EMAIL
    cy.wait(1000)
    cy.get("[data-testid=email_id_input]")
      .should("exist")
      .and("be.visible")
      .and("not.be.disabled")
      .type(email)

    cy.get("[data-testid=email_login_next_btn]")
      .should("exist")
      .and("be.visible")
      .and("not.be.disabled")
      .click()

    cy.getOTP(email).then((otp) => {
      const code = otp
      cy.get("[data-testid=verification_code_input]")
        .should("exist")
        .and("be.visible")
        .and("not.be.disabled")
        .type(code)

      cy.contains("label", "offline")
        .should("exist")
        .and("be.visible")
        .and("not.be.disabled")
        .click()
      cy.contains("label", "transactions:read")
        .should("exist")
        .and("be.visible")
        .and("not.be.disabled")
        .click()
      cy.contains("label", "payments:send")
        .should("exist")
        .and("be.visible")
        .and("not.be.disabled")
        .click()

      cy.get("[data-testid=submit_consent_btn]")
        .should("exist")
        .and("be.visible")
        .and("not.be.disabled")
        .click()

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
