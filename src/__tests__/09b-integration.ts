import { createTestClient } from "apollo-server-testing"
import { startApolloServer } from "../entrypoint/graphql"
import { sleep } from "../utils"
import { baseLogger } from "../logger"
import { yamlConfig } from "../config"

let server

beforeAll(async () => {
  ;({ server } = await startApolloServer())
  await sleep(2500)
})

it("start server", async () => {
  const { query } = createTestClient(server)

  const rest = await query({
    query: `query nodeStats {
    nodeStats {
        id
        peersCount
        channelsCount
    }
  }`,
  })

  baseLogger.info({ rest })
})

it("rate limit limiterRequestPhoneCode", async () => {
  const { mutate } = createTestClient(server)
  const phone = "+123"

  const mutation = `mutation requestPhoneCode ($phone: String) {
    requestPhoneCode (phone: $phone) {
        success
    }
  }`

  // exhaust the limiter
  for (let i = 0; i < yamlConfig.limits.requestPhoneCode.points; i++) {
    console.log(i)
    const result = await mutate({ mutation, variables: { phone } })
    expect(result.errors).toBeFalsy()
  }

  try {
    const {
      // @ts-expect-error: TODO
      errors: [{ code }],
    } = await mutate({ mutation, variables: { phone } })
    expect(code).toBe("TOO_MANY_REQUEST")
  } catch (err) {
    expect(true).toBeFalsy()
  }
})

it("rate limit login", async () => {
  const { mutate } = createTestClient(server)

  const { phone, code: correct_code } = yamlConfig.test_accounts[9]
  const bad_code = 123456

  const mutation = `mutation login ($phone: String, $code: Int) {
    login (phone: $phone, code: $code) {
        token
    }
  }`

  const {
    data: {
      login: { token: tokenNull },
    },
  } = await mutate({ mutation, variables: { phone, code: bad_code } })
  expect(tokenNull).toBeFalsy()

  // will do with iosredis
  // expect(await redis.get(`login:${phone}`))
  // to exist

  const {
    data: {
      login: { token },
    },
  } = await mutate({ mutation, variables: { phone, code: correct_code } })
  expect(token).toBeTruthy()

  // expect(await redis.get(`login:${phone}`))
  // to not exist

  // exhaust the limiter
  for (let i = 0; i < yamlConfig.limits.loginAttempt.points; i++) {
    const result = await mutate({ mutation, variables: { phone, code: bad_code } })
    expect(result.errors).toBeFalsy()
  }

  try {
    const result = await mutate({ mutation, variables: { phone, code: correct_code } })
    // @ts-expect-error: TODO
    expect(result.errors[0].code).toBe("TOO_MANY_REQUEST")
    expect(result.data.login.token).toBeFalsy()
  } catch (err) {
    expect(true).toBeFalsy()
  }
})

afterAll(async () => {
  await sleep(2500)
})
