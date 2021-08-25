import { redis } from "@services/redis"
import { sleep } from "@core/utils"
import { yamlConfig, JWT_SECRET } from "@config/app"
import { createTestClient } from "apollo-server-integration-testing"
import { startApolloServerForCoreSchema } from "@servers/graphql-main-server"
import * as jwt from "jsonwebtoken"

import USER_REQUEST_AUTH_CODE from "./graphql-main-server/mutations/user-request-auth-code.gql"
import USER_LOGIN from "./graphql-main-server/mutations/user-login.gql"
import LN_NO_AMOUNT_INVOICE_CREATE from "./graphql-main-server/mutations/ln-no-amount-invoice-create.gql"

jest.mock("@services/realtime-price", () => require("test/mocks/realtime-price"))
jest.mock("@services/phone-provider", () => require("test/mocks/phone-provider"))

let apolloServer, httpServer, mutate, setOptions, correctCode
const { phone, code } = yamlConfig.test_accounts[9]

beforeAll(async () => {
  correctCode = `${code}`
  ;({ apolloServer, httpServer } = await startApolloServerForCoreSchema())
  ;({ mutate, setOptions } = createTestClient({ apolloServer }))
  await sleep(2500)
})

beforeEach(async () => {
  await clearLimiters("login")
  await clearLimiters("failed_attempt_ip")
  await clearLimiters("request_phone_code")
  await clearLimiters("request_phone_code_ip")
})

afterAll(async () => {
  await sleep(2500)
  await httpServer.close()
  redis.disconnect()
})

describe("graphql", () => {
  describe("userRequestAuthCode", () => {
    const mutation = USER_REQUEST_AUTH_CODE

    it("success with a valid phone", async () => {
      const input = { phone }
      const result = await mutate(mutation, { variables: { input } })
      expect(result.data.userRequestAuthCode).toEqual(
        expect.objectContaining({ success: true }),
      )
    })

    it("returns error for invalid phone", async () => {
      const message = "Invalid value for Phone"
      let input = { phone: "+123" }

      let result = await mutate(mutation, { variables: { input } })
      expect(result.data.userRequestAuthCode.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ message })]),
      )

      input = { phone: "abcd" }
      result = await mutate(mutation, { variables: { input } })
      expect(result.data.userRequestAuthCode.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ message })]),
      )

      input = { phone: "" }
      result = await mutate(mutation, { variables: { input } })
      expect(result.data.userRequestAuthCode.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ message })]),
      )
    })
  })

  describe("userLogin", () => {
    const mutation = USER_LOGIN

    it("returns a jwt token for a valid phone/code", async () => {
      const input = { phone, code: correctCode }
      const result = await mutate(mutation, { variables: { input } })
      expect(result.data.userLogin).toHaveProperty("authToken")
      const token = jwt.verify(result.data.userLogin.authToken, `${JWT_SECRET}`)
      expect(token).toHaveProperty("uid")
      expect(token).toHaveProperty("network")
      expect(token).toHaveProperty("iat")
    })

    it("returns error for invalid phone", async () => {
      let phone = "+19999999999"
      let message = "Invalid request"
      let input = { phone, code: correctCode }
      let result = await mutate(mutation, { variables: { input } })
      expect(result.data.userLogin.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ message })]),
      )

      phone = "+1999"
      message = "Invalid value for Phone"
      input = { phone, code: correctCode }
      result = await mutate(mutation, { variables: { input } })
      expect(result.data.userLogin.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ message })]),
      )

      phone = "abcd"
      input = { phone, code: correctCode }
      result = await mutate(mutation, { variables: { input } })
      expect(result.data.userLogin.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ message })]),
      )

      phone = ""
      input = { phone, code: correctCode }
      result = await mutate(mutation, { variables: { input } })
      expect(result.data.userLogin.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ message })]),
      )
    })

    it("returns error for invalid code", async () => {
      let message = "Invalid request"
      let input = { phone, code: "113566" }
      let result = await mutate(mutation, { variables: { input } })
      expect(result.data.userLogin.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ message })]),
      )

      message = "Invalid value for OneTimeAuthCode"
      input = { phone, code: "abcdef" }
      result = await mutate(mutation, { variables: { input } })
      expect(result.data.userLogin.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ message })]),
      )

      input = { phone, code: "" }
      result = await mutate(mutation, { variables: { input } })
      expect(result.data.userLogin.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ message })]),
      )
    })
  })

  describe("lnNoAmountInvoiceCreate", () => {
    const mutation = LN_NO_AMOUNT_INVOICE_CREATE

    beforeAll(async () => {
      const input = { phone, code: correctCode }
      const result = await mutate(USER_LOGIN, { variables: { input } })
      const token = jwt.verify(result.data.userLogin.authToken, `${JWT_SECRET}`)
      // mock jwt middleware
      setOptions({ request: { token } })
    })

    afterAll(async () => {
      setOptions({ request: { token: null } })
    })

    it("returns a valid lightning invoice", async () => {
      const input = { memo: "This is a lightning invoice" }
      const result = await mutate(mutation, { variables: { input } })
      const { invoice } = result.data.lnNoAmountInvoiceCreate
      expect(invoice).toHaveProperty("paymentRequest")
      expect(invoice).toHaveProperty("paymentHash")
      expect(invoice).toHaveProperty("paymentSecret")
    })
  })
})

const clearLimiters = async (prefix) => {
  const keys = await redis.keys(`${prefix}:*`)
  for (const key of keys) {
    await redis.del(key)
  }
}
