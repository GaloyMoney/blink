import { testData } from "../support/test-config"

describe("Login Phone", () => {
  it("should be able to login via telegram passport", () => {
    cy.flushRedis()
    cy.visit(testData.AUTHORIZATION_URL)
    cy.location("search").should((search) => {
      const params = new URLSearchParams(search)
      expect(params.has("login_challenge")).to.be.true
    })

    cy.get("[data-testid=sign_in_with_email_btn]")
      .should("exist")
      .should("be.visible")
      .click()

    cy.get("[data-testid=sign_in_with_phone_btn]")
      .should("exist")
      .should("be.visible")
      .click()

    cy.get("[data-testid=phone_number_input]")
      .should("exist")
      .should("be.visible")
      .should("not.be.disabled")
      .type(testData.PHONE_NUMBER)

    cy.get("[data-testid=phone_number_channel_select]")
      .should("exist")
      .should("be.visible")
      .should("not.be.disabled")
      .select("TELEGRAM")

    cy.get("[data-testid=phone_login_next_btn]")
      .should("exist")
      .should("be.visible")
      .should("not.be.disabled")
      .click()

    // Get the Telegram auth button and extract the nonce
    cy.get("[data-testid=telegram_passport_auth_btn]")
      .should("exist")
      .should("be.visible")
      .should("not.be.disabled")
      .then(($button) => {
        const nonce = $button.attr("data-testnonce")

        // Simulate the Telegram Passport webhook using the nonce from the attribute
        cy.simulateTelegramPassportWebhook(testData.PHONE_NUMBER, nonce || "").then(
          () => {
            cy.window().then((win) => {
              win.checkAuthStatus().then(() => {
                // After successful authentication, user should be redirected to the consent page
                cy.get("[data-testid=submit_consent_btn]", { timeout: 15000 })
                  .should("exist")
                  .should("be.visible")
                  .should("not.be.disabled")
              })
            })
          },
        )
      })
  })
})
