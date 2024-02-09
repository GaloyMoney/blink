export const testData = {
  NEXT_AUTH_SESSION_TOKEN: Cypress.env("NEXT_AUTH_SESSION_TOKEN"),
  EMAIL: "test@galoy.io",
  CALLBACK_URL: "https://www.google.com/",
  PHONE: "+16505554350",
  CODE: "000000",
}

export const CORE_URL = "http://localhost:4455"

export const usdWalletExpectedTransactions = [
  {
    settlementAmount: -1000,
    settlementCurrency: "USD",
    status: "SUCCESS",
    settlementDisplayAmount: "-10.00",
  },
  {
    settlementAmount: -1200,
    settlementCurrency: "USD",
    status: "SUCCESS",
    settlementDisplayAmount: "-12.00",
  },
]

export const btcWalletExpectedTransactions = [
  {
    settlementCurrency: "BTC",
    status: "SUCCESS",
    settlementDisplayAmount: "-5.00",
  },
  {
    settlementAmount: -100,
    settlementCurrency: "BTC",
    status: "SUCCESS",
  },
]
