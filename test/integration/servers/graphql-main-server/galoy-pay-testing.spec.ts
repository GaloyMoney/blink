import { JWT_SECRET, yamlConfig } from "@config/app"
import { sleep } from "@core/utils"
import { startApolloServerForCoreSchema } from "@servers/graphql-main-server"
import { createTestClient } from "apollo-server-integration-testing"
import { createHttpTerminator } from "http-terminator"
import * as jwt from "jsonwebtoken"
import { clearAccountLocks, clearLimiters } from "test/helpers"
import USER_LOGIN from "./mutations/user-login.gql"
import NODE_IDS from "./queries/node-ids.gql"
import USER_DEFAULT_WALLET_ID from "./queries/user-default-walletid.gql"
import LN_INVOICE_CREATE_ON_BEHALF_OF from "./mutations/ln-invoice-create-on-behalf-of-recipient.gql"
import LN_NO_AMOUNT_INVOICE_CREATE_ON_BEHALF_OF from "./mutations/ln-no-amount-invoice-create-on-behalf-of-recipient.gql"
import crypto from "crypto"

jest.mock("@services/twilio", () => require("test/mocks/twilio"))

let apolloServer, httpServer, httpTerminator, query, mutate, setOptions
const receivingUsername = "user0"
let recievingWalletId
const { phone, code } = yamlConfig.test_accounts[3]

beforeAll(async () => {
  ;({ apolloServer, httpServer } = await startApolloServerForCoreSchema())
  ;({ query, mutate, setOptions } = createTestClient({ apolloServer }))
  httpTerminator = createHttpTerminator({ server: httpServer })
  await sleep(2500)
  const input = { phone, code: `${code}` }
  const result = await mutate(USER_LOGIN, { variables: { input } })
  const token = jwt.verify(result.data.userLogin.authToken, `${JWT_SECRET}`)
  // mock jwt middleware
  setOptions({ request: { token } })
})

beforeEach(async () => {
  await clearLimiters()
  await clearAccountLocks()
})

afterAll(async () => {
  setOptions({ request: { token: null } })
  await httpTerminator.terminate()
})

describe("galoy-pay", () => {
  describe("getDefaultWalletId", () => {
    const myQuery = USER_DEFAULT_WALLET_ID

    it("returns a value for an existing username", async () => {
      const input = { username: receivingUsername }
      const result = await query(myQuery, { variables: input })

      const walletId = result.data.userDefaultWalletId
      expect(walletId).toBeTruthy()
      recievingWalletId = walletId
    })

    it("returns an error for invalid username syntax", async () => {
      const input = { username: "username-incorrectly-formatted" }
      const result = await query(myQuery, { variables: input })
      expect(result.errors[0].code).toBe("BAD_USER_INPUT")
    })

    it("returns an error for an inexistant username", async () => {
      const input = { username: "user1234" }
      const result = await query(myQuery, { variables: input })
      expect(result.errors[0].code).toBe("NOT_FOUND")
    })
  })

  describe("nodeIds", () => {
    const myQuery = NODE_IDS

    it("returns a nonempty list of nodes", async () => {
      const result = await query(myQuery)
      expect(result.data.globals.nodesIds.length).toBeGreaterThan(0)
    })
  })

  describe("lnInvoiceCreateOnBehalfOfRecipient", () => {
    const mutation = LN_INVOICE_CREATE_ON_BEHALF_OF

    it("creates an invoice with valid inputs", async () => {
      const metadata = JSON.stringify([["text/plain", `Payment to ${receivingUsername}`]])
      const descriptionHash = crypto.createHash("sha256").update(metadata).digest("hex")
      const input = {
        walletId: recievingWalletId,
        amount: 1000,
        descriptionHash,
      }

      const result = await mutate(mutation, { variables: input })
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

      const result = await mutate(mutation, { variables: input })
      const { invoice, errors } = result.data.mutationData

      expect(invoice).toBeNull()
      expect(errors.length).toBeGreaterThan(0)
    })

    it("returns an error with a negative amount", async () => {
      const metadata = JSON.stringify([["text/plain", `Payment to ${receivingUsername}`]])
      const descriptionHash = crypto.createHash("sha256").update(metadata).digest("hex")
      const input = {
        walletId: recievingWalletId,
        amount: -1,
        descriptionHash,
      }

      const result = await mutate(mutation, { variables: input })
      const { invoice, errors } = result.data.mutationData

      expect(errors.length).toBeGreaterThan(0)
      expect(invoice).toBe(null)
    })

    it("returns an error with a zero amount", async () => {
      const metadata = JSON.stringify([["text/plain", `Payment to ${receivingUsername}`]])
      const descriptionHash = crypto.createHash("sha256").update(metadata).digest("hex")
      const input = {
        walletId: recievingWalletId,
        amount: 0,
        descriptionHash,
      }

      const result = await mutate(mutation, { variables: input })
      const { invoice, errors } = result.data.mutationData

      expect(errors.length).toBeGreaterThan(0)
      expect(invoice).toBe(null)
    })
  })

  describe("lnNoAmountInvoiceCreateOnBehalfOfRecipient", () => {
    const mutation = LN_NO_AMOUNT_INVOICE_CREATE_ON_BEHALF_OF

    it("returns a valid lightning invoice", async () => {
      const input = { walletId: recievingWalletId }

      const result = await mutate(mutation, { variables: input })
      const { invoice, errors } = result.data.mutationData

      expect(errors).toHaveLength(0)
      expect(invoice).toHaveProperty("paymentRequest")
      expect(invoice.paymentRequest.startsWith("lnbc")).toBeTruthy()
    })

    it("returns an error with an invalid walletId", async () => {
      const input = { walletId: "wallet-id-does-not-exist" }

      const result = await mutate(mutation, { variables: input })
      const { invoice, errors } = result.data.mutationData

      expect(invoice).toBeNull()
      expect(errors.length).toBeGreaterThan(0)
    })
  })
})
