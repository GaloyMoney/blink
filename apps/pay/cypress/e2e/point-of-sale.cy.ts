import { testData } from "../support/test-config"

const username = "test_user_a"
const cashRegisterUrl = `/${username}?amount=0&display=USD`
describe("Point of Sale", () => {
  it("should navigate to user cash register", () => {
    cy.visit("/")

    cy.get("input[data-testid=username-txt]").should("exist")
    cy.get("input[data-testid=username-txt]").type(username)
    cy.get("button[data-testid=submit-btn]").click()

    cy.url().should("include", `/${username}`)
  })

  it("should navigate to printable paycode", () => {
    cy.visit(cashRegisterUrl)
    cy.get("[data-testid=menu]").click()
    cy.get("[data-testid=printable-paycode-link]").click()

    cy.url().should("include", "/print")
    cy.get("[data-testid=qrcode-container]").as("qrcodeContainer")
    cy.get("@qrcodeContainer").find("canvas").should("exist")
    cy.get("[data-testid=print-btn]").should("exist")
  })

  it("should have a valid keyboard", () => {
    cy.visit(cashRegisterUrl)

    cy.get("button[data-testid=digit-0-btn]").should("exist")
    cy.get("button[data-testid=digit-1-btn]").should("exist")
    cy.get("button[data-testid=digit-2-btn]").should("exist")
    cy.get("button[data-testid=digit-3-btn]").should("exist")
    cy.get("button[data-testid=digit-4-btn]").should("exist")
    cy.get("button[data-testid=digit-5-btn]").should("exist")
    cy.get("button[data-testid=digit-6-btn]").should("exist")
    cy.get("button[data-testid=digit-7-btn]").should("exist")
    cy.get("button[data-testid=digit-8-btn]").should("exist")
    cy.get("button[data-testid=digit-9-btn]").should("exist")
    cy.get("button[data-testid='digit-.-btn']").should("exist")
    cy.get("button[data-testid=backspace-btn]").should("exist")
    cy.get("button[data-testid=pay-btn]").should("exist")
  })

  it("should create an invoice", () => {
    cy.visit(cashRegisterUrl)
    cy.get("button[data-testid=digit-1-btn]").click()
    cy.get("button[data-testid=digit-0-btn]").click()
    cy.get("button[data-testid=pay-btn]").click()

    cy.url().should("include", "amount=10")
    cy.get("[data-testid=copy-btn]").should("exist")
    cy.get("[data-testid=share-lbl]").should("exist")
    cy.get("[data-testid=qrcode-container]").should("exist")
    cy.get("[data-testid=qrcode-container]").as("qrcodeContainer")
    cy.get("@qrcodeContainer").find("canvas").should("exist")
  })

  it("should create and pay an invoice", () => {
    cy.visit(cashRegisterUrl)
    cy.get("button[data-testid=digit-1-btn]").click()
    cy.get("button[data-testid=digit-0-btn]").click()
    cy.get("button[data-testid=pay-btn]").click()

    cy.get("[data-testid=copy-btn]").should("exist")
    cy.get("[data-testid=share-lbl]").should("exist")
    cy.get("[data-testid=qrcode-container]").should("exist")
    cy.get("[data-testid=qrcode-container]").as("qrcodeContainer")
    cy.get("@qrcodeContainer").find("canvas").should("exist")
    cy.get("[data-testid=copy-btn]").should("exist").click()

    cy.window()
      .then((win) => {
        win.focus()
        return win.navigator.clipboard.readText()
      })
      .then((text) => {
        const paymentRequest = text
        cy.log("Payment Request:", paymentRequest)

        cy.loginAndGetToken(testData.PHONE, testData.CODE).then((token) => {
          const authToken = token
          cy.log("authToken", authToken)

          cy.fetchMe(authToken).then((response) => {
            const walletId = response.body.data.me.defaultAccount.defaultWalletId
            cy.log("Wallet ID:", walletId)

            cy.sendInvoicePayment(paymentRequest, walletId, authToken)
              .then((paymentResponse) => {
                expect(paymentResponse.body.data.lnInvoicePaymentSend.status).to.equal(
                  "SUCCESS",
                )
              })
              .then(() => {
                cy.wait(3000)
                cy.get("[data-testid=success-icon]").should("exist")
                cy.get("[data-testid=success-icon]").should("be.visible")
              })
          })
        })
      })
  })
})
