import {
  testData,
  usdWalletExpectedTransactions,
  btcWalletExpectedTransactions,
} from "../../support/test-data"

describe("Batch payments test", () => {
  beforeEach(() => {
    cy.viewport(1920, 1080)
    cy.setCookie("next-auth.session-token", testData.NEXT_AUTH_SESSION_TOKEN, {
      secure: true,
    })
    cy.visit("/batch-payments")
  })

  it("Batch Payments Test", () => {
    cy.get("[data-testid=csv-upload-input]").selectFile("cypress/fixtures/template.csv")

    cy.get("[data-testid=confirm-batch-payments-btn]").should("exist")
    cy.get("[data-testid=confirm-batch-payments-btn]").should("be.visible")
    cy.get("[data-testid=confirm-batch-payments-btn]").should("not.be.disabled")
    cy.get("[data-testid=confirm-batch-payments-btn]").click()

    cy.get("[data-testid=batch-payments-modal-message]").should(
      "have.text",
      "Batch Payment Completed",
    )

    cy.loginAndGetToken(testData.PHONE, testData.CODE).then((token) => {
      const authToken = token
      cy.getTransactions(authToken, 4).then((transactions) => {
        const btcTransactions = transactions.filter(
          (transaction) => transaction.settlementCurrency === "BTC",
        )

        btcWalletExpectedTransactions.forEach((expectedBtcTransaction) => {
          const found = btcTransactions.some(
            (transaction) =>
              transaction.settlementCurrency ===
                expectedBtcTransaction.settlementCurrency &&
              transaction.status === expectedBtcTransaction.status &&
              (expectedBtcTransaction.settlementDisplayAmount
                ? transaction.settlementDisplayAmount ===
                  expectedBtcTransaction.settlementDisplayAmount
                : true),
          )
          expect(found).to.be.true
        })

        usdWalletExpectedTransactions.forEach((expectedUsdTransaction) => {
          expect(transactions).to.deep.include(expectedUsdTransaction)
        })
      })
    })
  })
})
