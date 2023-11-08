import { testData } from "../.../../../support/test-data"
describe("Account ID Test", () => {
  before(() => {
    cy.setCookie("next-auth.session-token", testData.NEXT_AUTH_SESSION_TOKEN, {
      secure: true,
    })
    cy.visit("/")
  })

  it("Login email Test", () => {
    cy.get("[data-testid=submit_consent_btn]").click()
  })
})
