/// <reference types="cypress" />
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
//
// declare global {
//   namespace Cypress {
//     interface Chainable {
//       login(email: string, password: string): Chainable<void>
//       drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       dismiss(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       visit(originalFn: CommandOriginalFn, url: string, options: Partial<VisitOptions>): Chainable<Element>
//     }
//   }
// }

// eslint-disable-next-line @typescript-eslint/no-namespace
declare namespace Cypress {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface Chainable<Subject> {
    getOTP(email: string): Chainable<string>
    requestEmailCode(email: string): Chainable<string>
    simulateTelegramPassportWebhook(phone: string, nonce: string): Chainable<boolean>
    flushRedis(): Chainable<void>
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

Cypress.Commands.add("requestEmailCode", (email) => {
  return cy
    .request({
      method: "POST",
      url: "http://localhost:4455/auth/email/code",
      body: {
        email: email,
      },
    })
    .then((response) => {
      return response.body.result
    })
})

Cypress.Commands.add("simulateTelegramPassportWebhook", (phone, nonce) => {
  return cy
    .exec(
      `
      export PROJECT_ROOT="$(pwd)/../.."
      source ../../bats/helpers/telegram.bash
      simulateTelegramPassportWebhook "${nonce}" "${phone.replace("+", "")}"
      `,
    )
    .then((result) => {
      cy.log("Telegram Passport webhook simulation result:")
      cy.log(result.stdout)

      if (result.code !== 0) {
        throw new Error(`Failed to simulate Telegram Passport webhook: ${result.stderr}`)
      }

      // Return a wrapped value that Cypress can chain from
      return cy.wrap(true)
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
