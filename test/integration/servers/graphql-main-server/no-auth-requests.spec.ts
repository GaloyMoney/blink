import { yamlConfig, JWT_SECRET } from "@config/app"
import * as jwt from "jsonwebtoken"

import { RateLimitConfig } from "@domain/rate-limit"
import {
  UserLoginIpRateLimiterExceededError,
  UserLoginPhoneRateLimiterExceededError,
  UserPhoneCodeAttemptIpRateLimiterExceededError,
  UserPhoneCodeAttemptPhoneMinIntervalRateLimiterExceededError,
  UserPhoneCodeAttemptPhoneRateLimiterExceededError,
} from "@domain/rate-limit/errors"

import { ApolloClient, NormalizedCacheObject } from "@apollo/client/core"

import USER_REQUEST_AUTH_CODE from "./mutations/user-request-auth-code.gql"
import USER_LOGIN from "./mutations/user-login.gql"
import MAIN from "./queries/main.gql"

import {
  clearAccountLocks,
  clearLimiters,
  resetUserPhoneCodeAttemptIp,
  resetUserPhoneCodeAttemptPhone,
  resetUserLoginIpRateLimits,
  resetUserLoginPhoneRateLimits,
  resetUserPhoneCodeAttemptPhoneMinIntervalLimits,
  startServer,
  killServer,
  createApolloClient,
  defaultTestClientConfig,
  PID,
} from "test/helpers"

let correctCode: PhoneCode,
  apolloClient: ApolloClient<NormalizedCacheObject>,
  disposeClient: () => void,
  serverPid: PID
const { phone, code } = yamlConfig.test_accounts[9]

beforeAll(async () => {
  correctCode = `${code}` as PhoneCode
  serverPid = await startServer()
  ;({ apolloClient, disposeClient } = createApolloClient(defaultTestClientConfig()))
})

beforeEach(async () => {
  await clearLimiters()
  await clearAccountLocks()
})

afterAll(async () => {
  disposeClient()
  await killServer(serverPid)
})

describe("graphql", () => {
  describe("main query", () => {
    it("returns valid data", async () => {
      const { data } = await apolloClient.query({
        query: MAIN,
        variables: { hasToken: false },
      })
      expect(data.globals).toBeTruthy()
      expect(data.mobileVersions).toBeTruthy()
      expect(data.quizQuestions).toBeTruthy()

      expect(data.globals.nodesIds).toEqual(expect.arrayContaining([expect.any(String)]))
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

  describe("userRequestAuthCode", () => {
    const mutation = USER_REQUEST_AUTH_CODE

    it("success with a valid phone", async () => {
      const input = { phone }
      const result = await apolloClient.mutate({ mutation, variables: { input } })
      expect(result.data.userRequestAuthCode).toEqual(
        expect.objectContaining({ success: true }),
      )
    })

    it("returns error for invalid phone", async () => {
      const message = "Invalid value for Phone"
      let input = { phone: "+123" }

      let result = await apolloClient.mutate({ mutation, variables: { input } })
      expect(result.data.userRequestAuthCode.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ message })]),
      )

      input = { phone: "abcd" }
      result = await apolloClient.mutate({ mutation, variables: { input } })
      expect(result.data.userRequestAuthCode.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ message })]),
      )

      input = { phone: "" }
      result = await apolloClient.mutate({ mutation, variables: { input } })
      expect(result.data.userRequestAuthCode.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ message })]),
      )
    })

    it("rate limits too many phone requests", async () => {
      await testPhoneCodeAttemptPerPhoneMinInterval(mutation)
      await testPhoneCodeAttemptPerPhone(mutation)
      await testPhoneCodeAttemptPerIp(mutation)
    })
  })

  describe("userLogin", () => {
    const mutation = USER_LOGIN

    it("returns a jwt token for a valid phone/code", async () => {
      const input = { phone, code: correctCode }
      const result = await apolloClient.mutate({ mutation, variables: { input } })
      expect(result.data.userLogin).toHaveProperty("authToken")
      const token = jwt.verify(result.data.userLogin.authToken, `${JWT_SECRET}`)
      expect(token).toHaveProperty("uid")
      expect(token).toHaveProperty("network")
      expect(token).toHaveProperty("iat")
    })

    it("returns error for invalid phone", async () => {
      let phone = "+19999999999"
      let message = "Invalid or incorrect phone code entered."
      let input = { phone, code: correctCode }
      let result = await apolloClient.mutate({ mutation, variables: { input } })
      expect(result.data.userLogin.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ message })]),
      )

      phone = "+1999"
      message = "Invalid value for Phone"
      input = { phone, code: correctCode }
      result = await apolloClient.mutate({ mutation, variables: { input } })
      expect(result.data.userLogin.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ message })]),
      )

      phone = "abcd"
      input = { phone, code: correctCode }
      result = await apolloClient.mutate({ mutation, variables: { input } })
      expect(result.data.userLogin.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ message })]),
      )

      phone = ""
      input = { phone, code: correctCode }
      result = await apolloClient.mutate({ mutation, variables: { input } })
      expect(result.data.userLogin.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ message })]),
      )
    })

    it("returns error for invalid code", async () => {
      let message = "Invalid or incorrect phone code entered."
      let input = { phone, code: "113566" }
      let result = await apolloClient.mutate({ mutation, variables: { input } })
      expect(result.data.userLogin.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ message })]),
      )

      message = "Invalid value for OneTimeAuthCode"
      input = { phone, code: "abcdef" }
      result = await apolloClient.mutate({ mutation, variables: { input } })
      expect(result.data.userLogin.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ message })]),
      )

      input = { phone, code: "" }
      result = await apolloClient.mutate({ mutation, variables: { input } })
      expect(result.data.userLogin.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ message })]),
      )
    })

    it("rate limits too many invalid login requests by IP, wrong code", async () => {
      const args = {
        input: { phone, code: "000000" as PhoneCode },
        expectedMessage: "Invalid or incorrect phone code entered.",
        mutation,
      }
      await testRateLimitLoginByPhone(args)
      await testRateLimitLoginByIp(args)
    })

    it.skip("rate limits too many invalid login requests by IP, invalid code", async () => {
      const args = {
        input: { phone, code: "<invalid>" as PhoneCode },
        expectedMessage: "Invalid value for OneTimeAuthCode",
        mutation,
      }
      await testRateLimitLoginByPhone(args)
      await testRateLimitLoginByIp(args)
    })

    it("rate limits too many invalid login requests by IP, wrong phone", async () => {
      const args = {
        input: { phone: "+19999999999" as PhoneNumber, code: correctCode },
        expectedMessage: "Invalid or incorrect phone code entered.",
        mutation,
      }
      await testRateLimitLoginByPhone(args)
      await testRateLimitLoginByIp(args)
    })

    it.skip("rate limits too many invalid login requests by IP, invalid phone", async () => {
      const args = {
        input: { phone: "<invalid>" as PhoneNumber, code: correctCode },
        expectedMessage: "Invalid value for Phone",
        mutation,
      }
      await testRateLimitLoginByPhone(args)
      await testRateLimitLoginByIp(args)
    })
  })
})

const testPhoneCodeAttemptPerPhoneMinInterval = async (mutation) => {
  // Fetch limiter config
  const {
    limits: { points },
    error,
  } = RateLimitConfig.requestPhoneCodeAttemptPerPhoneMinInterval

  // Reset limiter
  const reset = await resetUserPhoneCodeAttemptPhoneMinIntervalLimits(phone)
  expect(reset).not.toBeInstanceOf(Error)
  if (reset instanceof Error) return reset

  // Exhaust limiter
  const input = { phone }
  for (let i = 0; i < points; i++) {
    {
      const reset = await resetUserPhoneCodeAttemptPhone(phone)
      expect(reset).not.toBeInstanceOf(Error)
      if (reset instanceof Error) return reset
    }
    {
      const reset = await resetUserPhoneCodeAttemptIp(undefined as unknown as IpAddress)
      expect(reset).not.toBeInstanceOf(Error)
      if (reset instanceof Error) return reset
    }

    const {
      data: {
        userRequestAuthCode: { success },
      },
    } = await apolloClient.mutate({ mutation, variables: { input } })
    expect(success).toBeTruthy()
  }

  // Check limiter is exhausted
  const { errors } = await apolloClient.mutate({ mutation, variables: { input } })
  expect(new error()).toBeInstanceOf(
    UserPhoneCodeAttemptPhoneMinIntervalRateLimiterExceededError,
  )
  expect(errors && errors[0].message).toMatch(new RegExp(`.*${error.name}.*`))
}

const testPhoneCodeAttemptPerPhone = async (mutation) => {
  // Fetch limiter config
  const {
    limits: { points },
    error,
  } = RateLimitConfig.requestPhoneCodeAttemptPerPhone

  // Reset limiter
  const reset = await resetUserPhoneCodeAttemptPhone(phone)
  expect(reset).not.toBeInstanceOf(Error)
  if (reset instanceof Error) return reset

  // Exhaust limiter
  const input = { phone }
  for (let i = 0; i < points; i++) {
    {
      const reset = await resetUserPhoneCodeAttemptPhoneMinIntervalLimits(phone)
      expect(reset).not.toBeInstanceOf(Error)
      if (reset instanceof Error) return reset
    }
    {
      const reset = await resetUserPhoneCodeAttemptIp(undefined as unknown as IpAddress)
      expect(reset).not.toBeInstanceOf(Error)
      if (reset instanceof Error) return reset
    }

    const {
      data: {
        userRequestAuthCode: { success },
      },
    } = await apolloClient.mutate({ mutation, variables: { input } })
    expect(success).toBeTruthy()
  }

  // Check limiter is exhausted
  const expectedErrorMessage =
    "Too many phone code attempts, please wait for a while and try again."
  const { errors } = await apolloClient.mutate({ mutation, variables: { input } })
  expect(new error()).toBeInstanceOf(UserPhoneCodeAttemptPhoneRateLimiterExceededError)
  expect(errors && errors[0].message).toBe(expectedErrorMessage)
}

const testPhoneCodeAttemptPerIp = async (mutation) => {
  // Fetch limiter config
  const {
    limits: { points },
    error,
  } = RateLimitConfig.requestPhoneCodeAttemptPerIp

  // Reset limiter
  const reset = await resetUserPhoneCodeAttemptIp(undefined as unknown as IpAddress)
  expect(reset).not.toBeInstanceOf(Error)
  if (reset instanceof Error) return reset

  // Exhaust limiter
  const input = { phone }
  for (let i = 0; i < points; i++) {
    {
      const reset = await resetUserPhoneCodeAttemptPhoneMinIntervalLimits(phone)
      expect(reset).not.toBeInstanceOf(Error)
      if (reset instanceof Error) return reset
    }
    {
      const reset = await resetUserPhoneCodeAttemptPhone(phone)
      expect(reset).not.toBeInstanceOf(Error)
      if (reset instanceof Error) return reset
    }

    const {
      data: {
        userRequestAuthCode: { success },
      },
    } = await apolloClient.mutate({ mutation, variables: { input } })
    expect(success).toBeTruthy()
  }

  // Check limiter is exhausted

  const expectedErrorMessage =
    "Too many phone code attempts on same network, please wait for a while and try again."
  const { errors } = await apolloClient.mutate({ mutation, variables: { input } })
  expect(new error()).toBeInstanceOf(UserPhoneCodeAttemptIpRateLimiterExceededError)
  expect(errors && errors[0].message).toBe(expectedErrorMessage)
}

const testRateLimitLoginByPhone = async ({
  input,
  expectedMessage,
  mutation,
}: {
  input: { phone: PhoneNumber; code: PhoneCode }
  expectedMessage: string
  mutation: DocumentNode
}) => {
  const { phone } = input

  // Fetch limiter config
  const {
    limits: { points },
    error,
  } = RateLimitConfig.failedLoginAttemptPerPhone

  // Reset limiter
  const reset = await resetUserLoginPhoneRateLimits(phone)
  expect(reset).not.toBeInstanceOf(Error)
  if (reset instanceof Error) return reset

  // Exhaust limiter
  for (let i = 0; i < points; i++) {
    const result = await apolloClient.mutate({ mutation, variables: { input } })
    expect(result.data.userLogin.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ message: expectedMessage })]),
    )
  }

  // Check limiter is exhausted
  const expectedErrorMessage =
    "Too many login attempts, please wait for a while and try again."
  const result = await apolloClient.mutate({ mutation, variables: { input } })
  expect(new error()).toBeInstanceOf(UserLoginPhoneRateLimiterExceededError)
  expect(result.data.userLogin.errors).toEqual(
    expect.arrayContaining([expect.objectContaining({ message: expectedErrorMessage })]),
  )
}

const testRateLimitLoginByIp = async ({
  input,
  expectedMessage,
  mutation,
}: {
  input: { phone: PhoneNumber; code: PhoneCode }
  expectedMessage: string
  mutation: DocumentNode
}) => {
  const ip = undefined as unknown as IpAddress
  const { phone } = input

  // Fetch limiter config
  const {
    limits: { points },
    error,
  } = RateLimitConfig.failedLoginAttemptPerIp

  // Reset limiter
  const resetIp = await resetUserLoginIpRateLimits(ip)
  expect(resetIp).not.toBeInstanceOf(Error)
  if (resetIp instanceof Error) return resetIp

  // Exhaust limiter
  for (let i = 0; i < points; i++) {
    const resetPhone = await resetUserLoginPhoneRateLimits(phone)
    expect(resetPhone).not.toBeInstanceOf(Error)
    if (resetPhone instanceof Error) return resetPhone

    const result = await apolloClient.mutate({ mutation, variables: { input } })
    expect(result.data.userLogin.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ message: expectedMessage })]),
    )
  }

  // Check limiter is exhausted
  const resetPhone = await resetUserLoginPhoneRateLimits(phone)
  expect(resetPhone).not.toBeInstanceOf(Error)
  if (resetPhone instanceof Error) return resetPhone

  const expectedErrorMessage =
    "Too many login attempts on same network, please wait for a while and try again."
  const result = await apolloClient.mutate({ mutation, variables: { input } })
  expect(new error()).toBeInstanceOf(UserLoginIpRateLimiterExceededError)
  expect(result.data.userLogin.errors).toEqual(
    expect.arrayContaining([expect.objectContaining({ message: expectedErrorMessage })]),
  )
}
