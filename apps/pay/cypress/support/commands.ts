/// <reference types="cypress" />
/* eslint-disable  @typescript-eslint/no-explicit-any */
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

// eslint-disable-next-line @typescript-eslint/no-namespace
declare namespace Cypress {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface Chainable<Subject> {
    flushRedis(): Chainable<void>
    loginAndGetToken(phone: string, code: string): Chainable<string>
    graphqlOperation(
      query: string,
      token: string,
      variables?: Record<string, unknown>,
    ): Chainable<Response<any>>
    fetchMe(token: string): Chainable<Response<any>>
    sendInvoicePayment(
      paymentRequest: string,
      walletId: string,
      token: string,
    ): Chainable<Response<any>>
  }
}

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
    url: "http://localhost:4455/auth/phone/login",
    body: {
      phone,
      code,
    },
  }).then((response) => {
    expect(response.body).to.have.property("authToken")
    return response.body.authToken
  })
})

Cypress.Commands.add("graphqlOperation", (query, token, variables = {}) => {
  return cy.request({
    method: "POST",
    url: "http://localhost:4455/graphql",
    body: {
      query,
      variables,
    },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
})

Cypress.Commands.add("fetchMe", (token) => {
  const query = `
    query Me {
      me {
        id
        defaultAccount {
          defaultWalletId
          displayCurrency
          id
          level
        }
      }
    }
  `
  return cy.graphqlOperation(query, token, {})
})

Cypress.Commands.add("sendInvoicePayment", (paymentRequest, walletId, token) => {
  const mutation = `
    mutation LnInvoicePaymentSend($input: LnInvoicePaymentInput!) {
      lnInvoicePaymentSend(input: $input) {
        errors {
          code
          message
          path
        }
        status
      }
    }
  `
  const variables = {
    input: {
      paymentRequest,
      walletId,
    },
  }
  return cy.graphqlOperation(mutation, token, variables)
})
