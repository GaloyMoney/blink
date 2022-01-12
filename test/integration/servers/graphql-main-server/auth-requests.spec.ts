import { JWT_SECRET, yamlConfig } from "@config/app"
import { toSats } from "@domain/bitcoin"
import { startApolloServerForCoreSchema } from "@servers/graphql-main-server"
import { sleep } from "@utils"
import { createTestClient } from "apollo-server-integration-testing"
import { createHttpTerminator } from "http-terminator"
import * as jwt from "jsonwebtoken"

import LN_INVOICE_CREATE from "./mutations/ln-invoice-create.gql"
import LN_INVOICE_FEE_PROBE from "./mutations/ln-invoice-fee-probe.gql"
import LN_INVOICE_PAYMENT_SEND from "./mutations/ln-invoice-payment-send.gql"
import LN_NO_AMOUNT_INVOICE_CREATE from "./mutations/ln-no-amount-invoice-create.gql"
import LN_NO_AMOUNT_INVOICE_FEE_PROBE from "./mutations/ln-no-amount-invoice-fee-probe.gql"
import LN_NO_AMOUNT_INVOICE_PAYMENT_SEND from "./mutations/ln-no-amount-invoice-payment-send.gql"
import USER_LOGIN from "./mutations/user-login.gql"
import ME from "./queries/me.gql"
import MAIN from "./queries/main.gql"

import {
  bitcoindClient,
  clearAccountLocks,
  clearLimiters,
  createInvoice,
  createMandatoryUsers,
  createUserWallet,
  fundWalletIdFromLightning,
  getDefaultWalletIdByTestUserIndex,
  lndOutside2,
} from "test/helpers"

jest.mock("@services/twilio", () => require("test/mocks/twilio"))

let apolloServer, httpServer, httpTerminator, query, mutate, setOptions, walletId
const { phone, code } = yamlConfig.test_accounts[0]

beforeAll(async () => {
  await bitcoindClient.loadWallet({ filename: "outside" })

  await createMandatoryUsers()
  await createUserWallet(0)
  walletId = await getDefaultWalletIdByTestUserIndex(0)
  await fundWalletIdFromLightning({ walletId, amount: toSats(50_000) })
  ;({ apolloServer, httpServer } = await startApolloServerForCoreSchema())
  ;({ query, mutate, setOptions } = createTestClient({ apolloServer }))
  httpTerminator = createHttpTerminator({ server: httpServer })
  await sleep(2500)
  const input = { phone, code: `${code}` }
  const result = await mutate(USER_LOGIN, { variables: { input } })
  const token = jwt.verify(result.data.userLogin.authToken, `${JWT_SECRET}`)
  // mock jwt middleware
  setOptions({ request: { token } })
  const meResult = await query(ME)
  expect(meResult.data.me.defaultAccount.defaultWalletId).toBe(walletId)
})

beforeEach(async () => {
  await clearLimiters()
  await clearAccountLocks()
})

afterAll(async () => {
  await bitcoindClient.unloadWallet({ walletName: "outside" })

  setOptions({ request: { token: null } })
  await httpTerminator.terminate()
})

describe("graphql", () => {
  describe("main query", () => {
    it("returns valid data", async () => {
      const { data } = await query(MAIN, { variables: { hasToken: true } })
      expect(data.globals).toBeTruthy()
      expect(data.me).toBeTruthy()
      expect(data.mobileVersions).toBeTruthy()
      expect(data.quizQuestions).toBeTruthy()

      expect(data.globals.nodesIds).toEqual(expect.arrayContaining([expect.any(String)]))
      expect(data.me).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          language: expect.any(String),
          phone: expect.any(String),
          defaultAccount: expect.objectContaining({
            id: expect.any(String),
            defaultWalletId: expect.any(String),
            wallets: expect.arrayContaining([
              expect.objectContaining({
                id: expect.any(String),
                balance: expect.any(Number),
                walletCurrency: expect.any(String),
                transactions: expect.objectContaining({
                  edges: expect.arrayContaining([
                    expect.objectContaining({
                      cursor: expect.any(String),
                      node: expect.objectContaining({
                        id: expect.any(String),
                        direction: expect.any(String),
                        status: expect.any(String),
                        settlementAmount: expect.any(Number),
                        settlementFee: expect.any(Number),
                        createdAt: expect.any(Number),
                      }),
                    }),
                  ]),
                  pageInfo: expect.any(Object),
                }),
              }),
            ]),
          }),
        }),
      )
      expect(data.mobileVersions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            currentSupported: expect.any(Number),
            minSupported: expect.any(Number),
            platform: expect.any(String),
          }),
        ]),
      )
      expect(data.quizQuestions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            earnAmount: expect.any(Number),
          }),
        ]),
      )
    })
  })

  describe("lnNoAmountInvoiceCreate", () => {
    const mutation = LN_NO_AMOUNT_INVOICE_CREATE

    it("returns a valid lightning invoice", async () => {
      const input = { walletId, memo: "This is a lightning invoice" }
      const result = await mutate(mutation, { variables: { input } })
      const { invoice, errors } = result.data.lnNoAmountInvoiceCreate
      expect(errors).toHaveLength(0)
      expect(invoice).toHaveProperty("paymentRequest")
      expect(invoice.paymentRequest.startsWith("lnbc")).toBeTruthy()
      expect(invoice).toHaveProperty("paymentHash")
      expect(invoice).toHaveProperty("paymentSecret")
    })

    it("returns a valid lightning invoice if memo is not passed", async () => {
      const input = { walletId }
      const result = await mutate(mutation, { variables: { input } })
      const { invoice, errors } = result.data.lnNoAmountInvoiceCreate
      expect(errors).toHaveLength(0)
      expect(invoice).toHaveProperty("paymentRequest")
      expect(invoice.paymentRequest.startsWith("lnbc")).toBeTruthy()
      expect(invoice).toHaveProperty("paymentHash")
      expect(invoice).toHaveProperty("paymentSecret")
    })
  })

  describe("lnInvoiceCreate", () => {
    const mutation = LN_INVOICE_CREATE

    it("returns a valid lightning invoice", async () => {
      const input = { walletId, amount: 1000, memo: "This is a lightning invoice" }
      const result = await mutate(mutation, { variables: { input } })
      const { invoice, errors } = result.data.lnInvoiceCreate
      expect(errors).toHaveLength(0)
      expect(invoice).toHaveProperty("paymentRequest")
      expect(invoice.paymentRequest.startsWith("lnbcrt10")).toBeTruthy()
      expect(invoice).toHaveProperty("paymentHash")
      expect(invoice).toHaveProperty("paymentSecret")
    })

    it("returns a valid lightning invoice if memo is not passed", async () => {
      const input = { walletId, amount: 1000 }
      const result = await mutate(mutation, { variables: { input } })
      const { invoice, errors } = result.data.lnInvoiceCreate
      expect(errors).toHaveLength(0)
      expect(invoice).toHaveProperty("paymentRequest")
      expect(invoice.paymentRequest.startsWith("lnbcrt10")).toBeTruthy()
      expect(invoice).toHaveProperty("paymentHash")
      expect(invoice).toHaveProperty("paymentSecret")
    })

    it("returns an error if amount is negative", async () => {
      const message = "Invalid value for SatAmount"
      const input = { walletId, amount: -1, memo: "This is a lightning invoice" }
      const result = await mutate(mutation, { variables: { input } })
      const { invoice, errors } = result.data.lnInvoiceCreate

      expect(errors).toHaveLength(1)
      expect(invoice).toBe(null)
      expect(errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ message })]),
      )
    })

    it("returns an error if amount is zero", async () => {
      const message = "A valid satoshi amount is required"
      const input = { walletId, amount: 0, memo: "This is a lightning invoice" }
      const result = await mutate(mutation, { variables: { input } })
      const { invoice, errors } = result.data.lnInvoiceCreate

      expect(errors).toHaveLength(1)
      expect(invoice).toBe(null)
      expect(errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ message })]),
      )
    })
  })

  describe("lnInvoiceFeeProbe", () => {
    const mutation = LN_INVOICE_FEE_PROBE

    it("returns a valid fee", async () => {
      const { request: paymentRequest } = await createInvoice({
        lnd: lndOutside2,
        tokens: 1_001,
      })

      const input = { walletId, paymentRequest }
      const result = await mutate(mutation, { variables: { input } })
      const { amount, errors } = result.data.lnInvoiceFeeProbe
      expect(errors).toHaveLength(0)
      expect(amount).toBe(0)
    })

    it("returns an error if it is unable to find a route for payment", async () => {
      const messageRegex = /^Payment amount '\d+' exceeds balance '\d+'$/
      const { request: paymentRequest } = await createInvoice({
        lnd: lndOutside2,
        tokens: 10_010_000_000,
      })

      const input = { walletId, paymentRequest }
      const result = await mutate(mutation, { variables: { input } })
      const { amount, errors } = result.data.lnInvoiceFeeProbe
      expect(errors).toHaveLength(1)
      expect(amount).toBe(null)
      expect(errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ message: expect.stringMatching(messageRegex) }),
        ]),
      )
    })
  })

  describe("lnNoAmountInvoiceFeeProbe", () => {
    const mutation = LN_NO_AMOUNT_INVOICE_FEE_PROBE

    it("returns a valid fee", async () => {
      const { request: paymentRequest } = await createInvoice({
        lnd: lndOutside2,
      })

      const input = { walletId, amount: 1_013, paymentRequest }
      const result = await mutate(mutation, { variables: { input } })
      const { amount, errors } = result.data.lnNoAmountInvoiceFeeProbe
      expect(errors).toHaveLength(0)
      expect(amount).toBe(0)
    })

    it("returns an error if it is unable to find a route for payment", async () => {
      const messageRegex = /^Payment amount '\d+' exceeds balance '\d+'$/
      const { request: paymentRequest } = await createInvoice({
        lnd: lndOutside2,
      })

      const input = { walletId, amount: 10_010_000_000, paymentRequest }
      const result = await mutate(mutation, { variables: { input } })
      const { amount, errors } = result.data.lnNoAmountInvoiceFeeProbe
      expect(errors).toHaveLength(1)
      expect(amount).toBe(null)
      expect(errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ message: expect.stringMatching(messageRegex) }),
        ]),
      )
    })
  })

  describe("lnInvoicePaymentSend", () => {
    const mutation = LN_INVOICE_PAYMENT_SEND
    beforeAll(async () => {
      const date = Date.now() + 1000 * 60 * 60 * 24 * 8
      // required to avoid withdrawal limits validation
      jest.spyOn(global.Date, "now").mockImplementation(() => new Date(date).valueOf())
    })

    afterAll(async () => {
      jest.restoreAllMocks()
    })

    it("sends a payment", async () => {
      const { request: paymentRequest } = await createInvoice({
        lnd: lndOutside2,
        tokens: 1,
      })

      const input = { walletId, paymentRequest }
      const result = await mutate(mutation, { variables: { input } })
      const { status, errors } = result.data.lnInvoicePaymentSend
      expect(errors).toHaveLength(0)
      expect(status).toBe("SUCCESS")
    })

    it("returns error when sends a payment to self", async () => {
      const message = "User tried to pay themselves"
      const input = { walletId, amount: 1, memo: "This is a lightning invoice" }
      const res = await mutate(LN_INVOICE_CREATE, { variables: { input } })
      const {
        invoice: { paymentRequest },
      } = res.data.lnInvoiceCreate

      const query = { variables: { input: { walletId, paymentRequest } } }
      const result = await mutate(mutation, query)
      const { status, errors } = result.data.lnInvoicePaymentSend
      expect(errors).toHaveLength(1)
      expect(status).toBe("FAILURE")
      expect(errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ message })]),
      )
    })
  })

  describe("lnNoAmountInvoicePaymentSend", () => {
    const mutation = LN_NO_AMOUNT_INVOICE_PAYMENT_SEND
    beforeAll(async () => {
      const date = Date.now() + 1000 * 60 * 60 * 24 * 8
      // required to avoid withdrawal limits validation
      jest.spyOn(global.Date, "now").mockImplementation(() => new Date(date).valueOf())
    })

    afterAll(async () => {
      jest.restoreAllMocks()
    })

    it("sends a payment", async () => {
      const { request: paymentRequest } = await createInvoice({
        lnd: lndOutside2,
        tokens: 0,
      })

      const input = { walletId, paymentRequest, amount: 1 }
      const result = await mutate(mutation, { variables: { input } })
      const { status, errors } = result.data.lnNoAmountInvoicePaymentSend
      expect(errors).toHaveLength(0)
      expect(status).toBe("SUCCESS")
    })

    it("returns error when sends a payment to self", async () => {
      const message = "User tried to pay themselves"
      const input = { walletId, memo: "This is a lightning invoice" }
      const res = await mutate(LN_NO_AMOUNT_INVOICE_CREATE, { variables: { input } })
      const {
        invoice: { paymentRequest },
      } = res.data.lnNoAmountInvoiceCreate

      const query = { variables: { input: { walletId, paymentRequest, amount: 1 } } }
      const result = await mutate(mutation, query)
      const { status, errors } = result.data.lnNoAmountInvoicePaymentSend
      expect(errors).toHaveLength(1)
      expect(status).toBe("FAILURE")
      expect(errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ message })]),
      )
    })
  })
})
