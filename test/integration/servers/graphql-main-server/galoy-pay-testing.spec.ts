import crypto from "crypto"

import { yamlConfig } from "@config/app"
import { ApolloClient, NormalizedCacheObject } from "@apollo/client/core"

import ME from "./queries/me.gql"
import USER_LOGIN from "./mutations/user-login.gql"
import NODE_IDS from "./queries/node-ids.gql"
import USER_DEFAULT_WALLET_ID from "./queries/user-default-walletid.gql"
import LN_INVOICE_CREATE_ON_BEHALF_OF from "./mutations/ln-invoice-create-on-behalf-of-recipient.gql"
import LN_NO_AMOUNT_INVOICE_CREATE_ON_BEHALF_OF from "./mutations/ln-no-amount-invoice-create-on-behalf-of-recipient.gql"
import PRICE from "./subscriptions/price.gql"
import LN_INVOICE_PAYMENT_STATUS from "./subscriptions/ln-invoice-payment-status.gql"
import LN_INVOICE_PAYMENT_SEND from "./mutations/ln-invoice-payment-send.gql"

import {
  clearAccountLocks,
  clearLimiters,
  getDefaultWalletIdByTestUserIndex,
} from "test/helpers"

import {
  createApolloClient,
  getSubscriptionNext,
  defaultTestClientConfig,
} from "test/helpers/apollo-client"

import { startServer, killServer } from "test/helpers/integration-server"

jest.setTimeout(300000)

let apolloClient: ApolloClient<NormalizedCacheObject>,
  disposeClient: () => void,
  receivingWalletId: WalletId
const receivingUsername = "user0"
const receivingUserIndex = 0
const sendingUserIndex = 4
const { phone, code } = yamlConfig.test_accounts[sendingUserIndex]

beforeAll(async () => {
  await startServer()
  ;({ apolloClient, disposeClient } = createApolloClient(defaultTestClientConfig()))
  const input = { phone, code: `${code}` }
  const result = await apolloClient.mutate({ mutation: USER_LOGIN, variables: { input } })
  // Create a new authenticated client
  disposeClient()
  ;({ apolloClient, disposeClient } = createApolloClient(
    defaultTestClientConfig(result.data.userLogin.authToken),
  ))
  receivingWalletId = await getDefaultWalletIdByTestUserIndex(receivingUserIndex)
})

beforeEach(async () => {
  await clearLimiters()
  await clearAccountLocks()
})

afterAll(async () => {
  disposeClient()
  await killServer()
})

describe("galoy-pay", () => {
  describe("getDefaultWalletId", () => {
    const myQuery = USER_DEFAULT_WALLET_ID

    it("returns a value for an existing username", async () => {
      const input = { username: receivingUsername }

      const result = await apolloClient.query({ query: myQuery, variables: input })
      const walletId = result.data.userDefaultWalletId

      expect(walletId).toBeTruthy()
    })

    it("returns an error for invalid username syntax", async () => {
      const input = { username: "username-incorrectly-formatted" }
      const message = "Invalid value for Username"
      const result = await apolloClient.query({ query: myQuery, variables: input })

      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ message: expect.stringContaining(message) }),
        ]),
      )
    })

    it("returns an error for an inexistent username", async () => {
      const input = { username: "user1234" }
      const message = "Account does not exist for username"

      const result = await apolloClient.query({ query: myQuery, variables: input })

      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ message: expect.stringContaining(message) }),
        ]),
      )
    })
  })

  describe("nodeIds", () => {
    const myQuery = NODE_IDS

    it("returns a nonempty list of nodes", async () => {
      const result = await apolloClient.query({ query: myQuery })

      expect(result.data.globals.nodesIds.length).toBeGreaterThan(0)
    })
  })

  describe("lnInvoiceCreateOnBehalfOfRecipient", () => {
    const mutation = LN_INVOICE_CREATE_ON_BEHALF_OF

    it("creates an invoice with valid inputs", async () => {
      const metadata = JSON.stringify([["text/plain", `Payment to ${receivingUsername}`]])
      const descriptionHash = crypto.createHash("sha256").update(metadata).digest("hex")
      const input = {
        walletId: receivingWalletId,
        amount: 1000,
        descriptionHash,
      }

      const result = await apolloClient.mutate({ mutation, variables: input })
      const { invoice, errors } = result.data.mutationData

      expect(errors).toHaveLength(0)
      expect(invoice).toHaveProperty("paymentRequest")
      expect(invoice.paymentRequest.startsWith("lnbc")).toBeTruthy()
      expect(invoice).toHaveProperty("paymentHash")
      expect(invoice).toHaveProperty("paymentSecret")
      expect(invoice.satoshis).toBeGreaterThan(0)
    })

    it("fails to create an invoice for a nonexistent walletId", async () => {
      const metadata = JSON.stringify([["text/plain", `Payment to ${receivingUsername}`]])
      const descriptionHash = crypto.createHash("sha256").update(metadata).digest("hex")
      const input = {
        walletId: "wallet-id-does-not-exist",
        amount: 1000,
        descriptionHash,
      }

      const result = await apolloClient.mutate({ mutation, variables: input })
      const { invoice, errors } = result.data.mutationData

      expect(invoice).toBeNull()
      expect(errors.length).toBeGreaterThan(0)
    })

    it("returns an error with a negative amount", async () => {
      const metadata = JSON.stringify([["text/plain", `Payment to ${receivingUsername}`]])
      const descriptionHash = crypto.createHash("sha256").update(metadata).digest("hex")
      const input = {
        walletId: receivingWalletId,
        amount: -1,
        descriptionHash,
      }

      const result = await apolloClient.mutate({ mutation, variables: input })
      const { invoice, errors } = result.data.mutationData

      expect(errors.length).toBeGreaterThan(0)
      expect(invoice).toBe(null)
    })

    it("returns an error with a zero amount", async () => {
      const metadata = JSON.stringify([["text/plain", `Payment to ${receivingUsername}`]])
      const descriptionHash = crypto.createHash("sha256").update(metadata).digest("hex")
      const input = {
        walletId: receivingWalletId,
        amount: 0,
        descriptionHash,
      }

      const result = await apolloClient.mutate({ mutation, variables: input })
      const { invoice, errors } = result.data.mutationData

      expect(errors.length).toBeGreaterThan(0)
      expect(invoice).toBe(null)
    })
  })

  describe("price", () => {
    const subscriptionQuery = PRICE

    it("returns data with valid inputs", async () => {
      const input = {
        amount: "100",
        amountCurrencyUnit: "BTCSAT",
        priceCurrencyUnit: "USDCENT",
      }

      const subscription = apolloClient.subscribe({
        query: subscriptionQuery,
        variables: input,
      })
      const result = (await getSubscriptionNext(subscription)) as { data }
      const { price, errors } = result.data?.price

      expect(errors.length).toEqual(0)
      expect(price).toHaveProperty("base")
      expect(price).toHaveProperty("offset")
      expect(price).toHaveProperty("formattedAmount")
      expect(price.currencyUnit).toEqual(input["priceCurrencyUnit"])
    })
  })

  describe("lnInvoicePaymentStatus", () => {
    const subscriptionQuery = LN_INVOICE_PAYMENT_STATUS

    it("returns payment status when paid", async () => {
      // Create an invoice on behalf of user0
      const metadata = JSON.stringify([["text/plain", `Payment to ${receivingUsername}`]])
      const descriptionHash = crypto.createHash("sha256").update(metadata).digest("hex")
      const createPaymentRequestInput = {
        walletId: receivingWalletId,
        amount: 1000,
        descriptionHash,
      }
      const createInvoice = await apolloClient.mutate({
        mutation: LN_INVOICE_CREATE_ON_BEHALF_OF,
        variables: createPaymentRequestInput,
      })
      const paymentRequest = createInvoice.data.mutationData.invoice.paymentRequest

      // Subscribe to the invoice
      const subscribeToPaymentInput = { paymentRequest }
      const subscription = apolloClient.subscribe({
        query: subscriptionQuery,
        variables: { input: subscribeToPaymentInput },
      })

      // Pay the invoice
      const fundingWalletId = (await apolloClient.query({ query: ME })).data.me
        .defaultAccount.defaultWalletId
      const makePaymentInput = { walletId: fundingWalletId, paymentRequest }
      const makePayment = await apolloClient.mutate({
        mutation: LN_INVOICE_PAYMENT_SEND,
        variables: { input: makePaymentInput },
      })
      expect(makePayment.data.lnInvoicePaymentSend.status).toEqual("SUCCESS")

      const result = (await getSubscriptionNext(subscription)) as { data }

      // Assert the the invoice is paid
      expect(result.data.lnInvoicePaymentStatus.status).toEqual("PAID")
    })
  })

  describe("lnNoAmountInvoiceCreateOnBehalfOfRecipient", () => {
    const mutation = LN_NO_AMOUNT_INVOICE_CREATE_ON_BEHALF_OF

    it("returns a valid lightning invoice", async () => {
      const input = { walletId: receivingWalletId }

      const result = await apolloClient.mutate({ mutation, variables: input })
      const { invoice, errors } = result.data.mutationData

      expect(errors).toHaveLength(0)
      expect(invoice).toHaveProperty("paymentRequest")
      expect(invoice.paymentRequest.startsWith("lnbc")).toBeTruthy()
    })

    it("returns an error with an invalid walletId", async () => {
      const input = { walletId: "wallet-id-does-not-exist" }

      const result = await apolloClient.mutate({ mutation, variables: input })
      const { invoice, errors } = result.data.mutationData

      expect(invoice).toBeNull()
      expect(errors.length).toBeGreaterThan(0)
    })
  })
})
