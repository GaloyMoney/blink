import {
  testData,
  expectedTransactions,
  btcPaymentInUSDCurrency,
} from "../../support/test-data"

describe("CSV Upload Component Test", () => {
  beforeEach(() => {
    cy.viewport(1920, 1080)
    cy.setCookie("next-auth.session-token", testData.NEXT_AUTH_SESSION_TOKEN, {
      secure: true,
    })
    cy.visit("/batch-payments")
  })

  it("uploads a CSV file via input and checks transactions", () => {
    cy.get("[data-testid=csv-upload-input]").selectFile("cypress/fixtures/template.csv")
    cy.get("[data-testid=confirm-batch-payments-btn]").click()
    cy.get("[data-testid=batch-payments-modal-message]").should(
      "contain.text",
      "Batch Payment Completed",
    )
    cy.loginAndGetToken(testData.PHONE, testData.CODE).then((token) => {
      const authToken = token
      cy.getTransactions(authToken, 4).then((transactions) => {
        // Check for specific BTC transactions
        btcPaymentInUSDCurrency.forEach((expectedBtcTransaction) => {
          const found = transactions.some(
            (transaction) =>
              transaction.settlementCurrency ===
                expectedBtcTransaction.settlementCurrency &&
              transaction.status === expectedBtcTransaction.status &&
              transaction.settlementDisplayAmount ===
                expectedBtcTransaction.settlementDisplayAmount,
          )
          expect(found).to.be.true
        })

        expectedTransactions.forEach((expectedTransaction) => {
          // Exclude the special case transactions
          if (
            !btcPaymentInUSDCurrency.some(
              (btcTx) =>
                btcTx.settlementCurrency === expectedTransaction.settlementCurrency &&
                btcTx.status === expectedTransaction.status &&
                btcTx.settlementDisplayAmount ===
                  expectedTransaction.settlementDisplayAmount,
            )
          ) {
            expect(transactions).to.deep.include(expectedTransaction)
          }
        })
      })
    })
  })
})
