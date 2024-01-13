/// <reference types="cypress" />

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

Cypress.Commands.add("getTransactions", (authToken, numberOfTransactions) => {
  cy.request({
    method: "POST",
    url: "http://localhost:4455/graphql",
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
