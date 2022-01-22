import { createHttpTerminator } from "http-terminator"
import {
  yamlConfig,
  getRequestPhoneCodePerPhoneLimits,
  getFailedLoginAttemptPerPhoneLimits,
} from "@config"
import { createTestClient } from "apollo-server-testing"
import { startApolloServerForOldSchema } from "@servers/graphql-old-server"

import { sleep } from "@utils"

import { clearAccountLocks, clearLimiters } from "test/helpers"

let apolloServer, httpServer, httpTerminator
const { phone, code: correctCode } = yamlConfig.test_accounts[9]
const badCode = 123456

jest.mock("@services/twilio", () => require("test/mocks/twilio"))

beforeAll(async () => {
  ;({ apolloServer, httpServer } = await startApolloServerForOldSchema())
  httpTerminator = createHttpTerminator({ server: httpServer })
  await sleep(2500)
})

beforeEach(async () => {
  await clearLimiters()
  await clearAccountLocks()
})

afterAll(async () => {
  await httpTerminator.terminate()
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
    const requestPhoneCodeLimits = getRequestPhoneCodePerPhoneLimits()
    for (let i = 0; i < requestPhoneCodeLimits.points; i++) {
      const result = await mutate({ mutation, variables: { phone } })
      expect(result.errors).toBeFalsy()
    }

    const {
      data: {
        requestPhoneCode: { success: value },
      },
    } = await mutate({ mutation, variables: { phone } })
    expect(value).toBeFalsy()
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

    {
      const {
        data: {
          login: { token },
        },
      } = await mutate({ mutation, variables: { phone, code: correctCode } })
      expect(token).toBeTruthy()
    }

    // exhaust the limiter
    const loginAttemptPerPhoneLimits = getFailedLoginAttemptPerPhoneLimits()

    for (let i = 0; i < loginAttemptPerPhoneLimits.points; i++) {
      const {
        data: {
          login: { token },
        },
      } = await mutate({ mutation, variables: { phone, code: badCode } })
      expect(token).toBeFalsy()
    }

    {
      const {
        data: {
          login: { token },
        },
      } = await mutate({ mutation, variables: { phone, code: correctCode } })
      expect(token).toBeFalsy()
    }
  })
})
