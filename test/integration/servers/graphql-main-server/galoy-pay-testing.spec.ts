import { JWT_SECRET, yamlConfig } from "@config/app"
import { sleep } from "@core/utils"
import { startApolloServerForCoreSchema } from "@servers/graphql-main-server"
import { createTestClient } from "apollo-server-integration-testing"
import { createHttpTerminator } from "http-terminator"
import * as jwt from "jsonwebtoken"
import { clearAccountLocks, clearLimiters } from "test/helpers"
import USER_LOGIN from "./mutations/user-login.gql"
import USER_DEFAULT_WALLET_ID from "./queries/user-default-walletid.gql"
import LN_INVOICE_CREATE from "./queries/ln-invoice-create-on-behalf-of-recipient.gql"
import crypto from "crypto"

jest.mock("@services/twilio", () => require("test/mocks/twilio"))

let apolloServer, httpServer, httpTerminator, query, mutate, setOptions
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

    it("value returned is a uuid-v4", async () => {
      const input = { username: "user0" }
      const result = await query(myQuery, { variables: input })

      const walletId = result.data.userDefaultWalletId
      expect(walletId).toHaveLength(36)
    })

    it("invalid username syntax", async () => {
      const input = { username: "user-does-not-exist" }
      const result = await query(myQuery, { variables: input })
      expect(result.errors[0].code).toBe("BAD_USER_INPUT")
    })

    it("inexistant username", async () => {
      const input = { username: "user1234" }
      const result = await query(myQuery, { variables: input })
      expect(result.errors[0].code).toBe("NOT_FOUND")
    })
  })

  // describe("lnInvoiceCreateOnBehalfOfRecipient", () => {
  //   const myMutation = LN_INVOICE_CREATE

  //   it("create invoice", async () => {
  //     const metadata = JSON.stringify([
  //       ["text/plain", `Payment to ${username}`],
  //       ["text/identifier", `${username}@${url.hostname}`],
  //     ])

  //     const descriptionHash = crypto.createHash("sha256").update(metadata).digest("hex")

  //     const input = {
  //       walletId,
  //       amount: amountSats,
  //       descriptionHash,
  //     }

  //     const result = await mutate(myMutation, { variables: input })

  //     const walletId = result.data.userDefaultWalletId

  //     console.log({ walletId, result })
  //     expect(walletId).toHaveLength(36)
  //     // expect(invoice).toHaveProperty("paymentRequest")
  //     // expect(invoice.paymentRequest.startsWith("lnbc")).toBeTruthy()
  //     // expect(invoice).toHaveProperty("paymentHash")
  //     // expect(invoice).toHaveProperty("paymentSecret")
  //   })
  // })
})
