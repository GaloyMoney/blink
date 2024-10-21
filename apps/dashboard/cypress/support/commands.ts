/// <reference types="cypress" />
import { CORE_URL } from "./test-data"

type Transaction = {
  settlementAmount: number
  settlementCurrency: string
  status: string
  settlementDisplayAmount: string
}

// eslint-disable-next-line @typescript-eslint/no-namespace
declare namespace Cypress {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface Chainable<Subject> {
    getOTP(email: string): Chainable<string>
    requestEmailCode(email: string): Chainable<string>
    flushRedis(): Chainable<void>
    loginAndGetToken(phone: string, code: string): Chainable<string>
    loginViaEmail(email: string): Chainable<null>
    getTransactions(
      authToken: string,
      numberOfTransactions: number,
    ): Chainable<Array<Transaction>>
  }
}

Cypress.Commands.add("getOTP", (email) => {
  const query = `docker exec -i galoy-dev-kratos-pg-1 psql -U dbuser -d default -t -c "SELECT body FROM courier_messages WHERE recipient='${email}' ORDER BY created_at DESC LIMIT 1;"`
  cy.exec(query).then((result) => {
    const rawMessage = result.stdout
    const otpMatch = rawMessage.match(/(\d{6})/)
    if (otpMatch && otpMatch[1]) {
      return otpMatch[1]
    } else {
      throw new Error("OTP not found in the message")
    }
  })
})

Cypress.Commands.add("flushRedis", () => {
  const command = `docker exec galoy-dev-redis-1 redis-cli FLUSHALL`
  cy.exec(command).then((result) => {
    if (result.code === 0) {
      cy.log("Redis FLUSHALL executed successfully")
    } else {
      throw new Error("Failed to execute FLUSHALL on Redis")
    }
  })
})

Cypress.Commands.add("loginAndGetToken", (phone, code) => {
  cy.flushRedis()
  cy.request({
    method: "POST",
    url: `${CORE_URL}/auth/phone/login`,
    body: {
      phone,
      code,
    },
  }).then((response) => {
    expect(response.body).to.have.property("authToken")
    return response.body.authToken
  })
})

Cypress.Commands.add("loginViaEmail", (email: string) => {
  cy.session(
    email,
    () => {
      cy.flushRedis()
      cy.visit("/api/auth/signin")

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
          .click()

        cy.contains("label", "write")
          .should("exist")
          .should("be.visible")
          .should("not.be.disabled")
          .click()

        cy.get("input#write")
          .should("be.visible") // Ensure the checkbox is visible
          .should("be.enabled") // Ensure the checkbox is enabled
          .check({ force: true }) // Try to check the checkbox
          .should("be.checked")

        cy.get("input#read")
          .should("be.visible") // Ensure the checkbox is visible
          .should("be.enabled") // Ensure the checkbox is enabled
          .check({ force: true }) // Try to check the checkbox
          .should("be.checked")

        cy.get("[data-testid=submit_consent_btn]")
          .should("exist")
          .should("be.visible")
          .should("not.be.disabled")
          .click()

        cy.url().should("eq", Cypress.config().baseUrl + "/")
      })
    },
    {
      validate() {
        cy.getCookie("next-auth.session-token").should("exist")
        cy.request("/").its("status").should("eq", 200)
      },
      cacheAcrossSpecs: true,
    },
  )
})

Cypress.Commands.add("getTransactions", (authToken, numberOfTransactions) => {
  cy.request({
    method: "POST",
    url: `${CORE_URL}/graphql`,
    headers: {
      "Authorization": `Bearer ${authToken}`,
      "Content-Type": "application/json",
    },
    body: {
      query: `
        query GetFirstTransactions($first: Int!) {
          me {
            defaultAccount {
              transactions(first: $first) {
                edges {
                  node {
                    settlementAmount
                    settlementCurrency
                    status
                    settlementDisplayAmount
                  }
                }
              }
            }
          }
        }
      `,
      variables: {
        first: numberOfTransactions,
      },
    },
  }).then((response) => {
    return response.body.data.me.defaultAccount.transactions.edges.map(
      (edge: { node: Transaction }) => edge.node,
    )
  })
})
