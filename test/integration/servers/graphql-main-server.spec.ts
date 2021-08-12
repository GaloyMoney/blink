import { redis } from "@services/redis"
import { sleep } from "@core/utils"
import { yamlConfig, getRequestPhoneCodeLimits, getLoginAttemptLimits } from "@config/app"
import { createTestClient } from "apollo-server-testing"
import { startApolloServerForOldSchema } from "@servers/graphql-old-server"

jest.mock("@services/realtime-price", () => require("test/mocks/realtime-price"))
jest.mock("@services/phone-provider", () => require("test/mocks/phone-provider"))

let apolloServer, httpServer
const { phone, code: correctCode } = yamlConfig.test_accounts[9]
const badCode = 123456

beforeAll(async () => {
  ;({ apolloServer, httpServer } = await startApolloServerForOldSchema())
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
  it("start server", async () => {
    const { query } = createTestClient(apolloServer)

    const {
      data: {
        nodeStats: { id, peersCount },
      },
    } = await query({
      query: `query nodeStats {
      nodeStats {
          id
          peersCount
          channelsCount
      }
    }`,
    })

    expect(id).toBeTruthy()
    expect(peersCount).toBeGreaterThanOrEqual(1)
  })

  it("rate limit limiterRequestPhoneCode", async () => {
    const { mutate } = createTestClient(apolloServer)
    const phone = "+123"

    const mutation = `mutation requestPhoneCode ($phone: String) {
      requestPhoneCode (phone: $phone) {
          success
      }
    }`

    // exhaust the limiter
    const requestPhoneCodeLimits = getRequestPhoneCodeLimits()
    for (let i = 0; i < requestPhoneCodeLimits.points; i++) {
      const result = await mutate({ mutation, variables: { phone } })
      expect(result.errors).toBeFalsy()
    }

    try {
      const result = await mutate({ mutation, variables: { phone } })
      expect(result.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ code: "TOO_MANY_REQUEST" })]),
      )
    } catch (err) {
      expect(true).toBeFalsy()
    }
  })

  it("rate limit login", async () => {
    const { mutate } = createTestClient(apolloServer)

    const mutation = `mutation login ($phone: String, $code: Int) {
      login (phone: $phone, code: $code) {
          token
      }
    }`

    const {
      data: {
        login: { token: tokenNull },
      },
    } = await mutate({ mutation, variables: { phone, code: badCode } })
    expect(tokenNull).toBeFalsy()

    const {
      data: {
        login: { token },
      },
    } = await mutate({ mutation, variables: { phone, code: correctCode } })
    expect(token).toBeTruthy()

    // exhaust the limiter
    const loginAttemptLimits = getLoginAttemptLimits()
    for (let i = 0; i < loginAttemptLimits.points; i++) {
      const result = await mutate({ mutation, variables: { phone, code: badCode } })
      expect(result.errors).toBeFalsy()
    }

    try {
      const result = await mutate({ mutation, variables: { phone, code: correctCode } })
      expect(result.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ code: "TOO_MANY_REQUEST" })]),
      )
      expect(result.data.login).toBeFalsy()
    } catch (err) {
      expect(true).toBeFalsy()
    }
  })
})

const clearLimiters = async (prefix) => {
  const keys = await redis.keys(`${prefix}:*`)
  for (const key of keys) {
    await redis.del(key)
  }
}
