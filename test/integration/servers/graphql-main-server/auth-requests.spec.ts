import { redis } from "@services/redis"
import { sleep } from "@core/utils"
import { yamlConfig, JWT_SECRET } from "@config/app"
import { createTestClient } from "apollo-server-integration-testing"
import { startApolloServerForCoreSchema } from "@servers/graphql-main-server"
import * as jwt from "jsonwebtoken"

import USER_LOGIN from "./mutations/user-login.gql"
import LN_NO_AMOUNT_INVOICE_CREATE from "./mutations/ln-no-amount-invoice-create.gql"
import LN_INVOICE_CREATE from "./mutations/ln-invoice-create.gql"
import LN_INVOICE_FEE_PROBE from "./mutations/ln-invoice-fee-probe.gql"
import LN_NO_AMOUNT_INVOICE_FEE_PROBE from "./mutations/ln-no-amount-invoice-fee-probe.gql"
import { createInvoice, lndOutside2 } from "test/helpers"

jest.mock("@services/realtime-price", () => require("test/mocks/realtime-price"))
jest.mock("@services/phone-provider", () => require("test/mocks/phone-provider"))

let apolloServer, httpServer, mutate, setOptions
const { phone, code } = yamlConfig.test_accounts[9]

beforeAll(async () => {
  ;({ apolloServer, httpServer } = await startApolloServerForCoreSchema())
  ;({ mutate, setOptions } = createTestClient({ apolloServer }))
  await sleep(2500)
  const input = { phone, code: `${code}` }
  const result = await mutate(USER_LOGIN, { variables: { input } })
  const token = jwt.verify(result.data.userLogin.authToken, `${JWT_SECRET}`)
  // console.warn(result.data.userLogin.authToken)
  // mock jwt middleware
  setOptions({ request: { token } })
})

beforeEach(async () => {
  await clearLimiters("login")
  await clearLimiters("failed_attempt_ip")
  await clearLimiters("request_phone_code")
  await clearLimiters("request_phone_code_ip")
})

afterAll(async () => {
  setOptions({ request: { token: null } })
  await sleep(2500)
  await httpServer.close()
  redis.disconnect()
})

describe("graphql", () => {
  describe("lnNoAmountInvoiceCreate", () => {
    const mutation = LN_NO_AMOUNT_INVOICE_CREATE

    it("returns a valid lightning invoice", async () => {
      const input = { memo: "This is a lightning invoice" }
      const result = await mutate(mutation, { variables: { input } })
      const { invoice, errors } = result.data.lnNoAmountInvoiceCreate
      expect(errors).toHaveLength(0)
      expect(invoice).toHaveProperty("paymentRequest")
      expect(invoice).toHaveProperty("paymentHash")
      expect(invoice).toHaveProperty("paymentSecret")
    })
  })

  describe("lnInvoiceCreate", () => {
    const mutation = LN_INVOICE_CREATE

    it("returns a valid lightning invoice", async () => {
      const input = { amount: 1000, memo: "This is a lightning invoice" }
      const result = await mutate(mutation, { variables: { input } })
      const { invoice, errors } = result.data.lnInvoiceCreate
      expect(errors).toHaveLength(0)
      expect(invoice).toHaveProperty("paymentRequest")
      expect(invoice).toHaveProperty("paymentHash")
      expect(invoice).toHaveProperty("paymentSecret")
    })
  })

  describe("lnInvoiceFeeProbe", () => {
    const mutation = LN_INVOICE_FEE_PROBE

    it("returns a valid fee", async () => {
      const { request: paymentRequest } = await createInvoice({
        lnd: lndOutside2,
        tokens: 1001,
      })

      const input = { paymentRequest }
      const result = await mutate(mutation, { variables: { input } })
      const { amount, errors } = result.data.lnInvoiceFeeProbe
      expect(errors).toHaveLength(0)
      expect(amount).toBe(0)
    })

    it("returns an error if it is unable to find a route for payment", async () => {
      const message = "Unable to find a route for payment"
      const { request: paymentRequest } = await createInvoice({
        lnd: lndOutside2,
        tokens: 10010000000,
      })

      const input = { paymentRequest }
      const result = await mutate(mutation, { variables: { input } })
      const { amount, errors } = result.data.lnInvoiceFeeProbe
      expect(errors).toHaveLength(1)
      expect(amount).toBe(null)
      expect(errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ message })]),
      )
    })
  })

  describe("lnNoAmountInvoiceFeeProbe", () => {
    const mutation = LN_NO_AMOUNT_INVOICE_FEE_PROBE

    it("returns a valid fee", async () => {
      const { request: paymentRequest } = await createInvoice({
        lnd: lndOutside2,
      })

      const input = { amount: 1013, paymentRequest }
      const result = await mutate(mutation, { variables: { input } })
      const { amount, errors } = result.data.lnNoAmountInvoiceFeeProbe
      expect(errors).toHaveLength(0)
      expect(amount).toBe(0)
    })

    it("returns an error if it is unable to find a route for payment", async () => {
      const message = "Unable to find a route for payment"
      const { request: paymentRequest } = await createInvoice({
        lnd: lndOutside2,
      })

      const input = { amount: 10010000000, paymentRequest }
      const result = await mutate(mutation, { variables: { input } })
      const { amount, errors } = result.data.lnNoAmountInvoiceFeeProbe
      expect(errors).toHaveLength(1)
      expect(amount).toBe(null)
      expect(errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ message })]),
      )
    })
  })
})

const clearLimiters = async (prefix) => {
  const keys = await redis.keys(`${prefix}:*`)
  for (const key of keys) {
    await redis.del(key)
  }
}
