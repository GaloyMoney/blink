/* eslint jest/expect-expect: ["error", { "assertFunctionNames": ["expect", "testPhoneCodeAttemptPerPhoneMinInterval", "testPhoneCodeAttemptPerPhone", "testPhoneCodeAttemptPerIp", "testRateLimitLoginByPhone", "testRateLimitLoginByIp"] }] */
import { BTC_NETWORK } from "@config"

import { RateLimitConfig, RateLimitPrefix } from "@domain/rate-limit"
import {
  UserLoginIpRateLimiterExceededError,
  UserLoginPhoneRateLimiterExceededError,
  UserPhoneCodeAttemptIpRateLimiterExceededError,
  UserPhoneCodeAttemptPhoneMinIntervalRateLimiterExceededError,
  UserPhoneCodeAttemptPhoneRateLimiterExceededError,
} from "@domain/rate-limit/errors"

import { ApolloClient, NormalizedCacheObject } from "@apollo/client/core"

import { publishCurrentPrices } from "@servers/trigger"

import { gql } from "apollo-server-core"

import {
  clearAccountLocks,
  clearLimiters,
  clearLimitersWithExclusions,
  createApolloClient,
  defaultStateConfig,
  defaultTestClientConfig,
  getPhoneAndCodeFromRef,
  initializeTestingState,
  killServer,
  promisifiedSubscription,
  startServer,
} from "test/helpers"
import { loginFromPhoneAndCode } from "test/e2e/account-creation-e2e"
import {
  MainQueryDocument,
  MainQueryQuery,
  PriceDocument,
  PriceSubscription,
  RealtimePriceDocument,
  RealtimePriceSubscription,
  UserLoginDocument,
  UserLoginMutation,
  UserRequestAuthCodeDocument,
  UserRequestAuthCodeMutation,
} from "test/e2e/generated"

let correctCode: PhoneCode,
  apolloClient: ApolloClient<NormalizedCacheObject>,
  disposeClient: () => void = () => null,
  serverPid: PID

const { phone, code } = getPhoneAndCodeFromRef("G")

beforeAll(async () => {
  await initializeTestingState(defaultStateConfig())
  serverPid = await startServer("start-main-ci")
  await loginFromPhoneAndCode({ phone, code })

  correctCode = `${code}` as PhoneCode
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
  describe("price", () => {
    gql`
      subscription price(
        $amount: SatAmount!
        $amountCurrencyUnit: ExchangeCurrencyUnit!
        $priceCurrencyUnit: ExchangeCurrencyUnit!
      ) {
        price(
          input: {
            amount: $amount
            amountCurrencyUnit: $amountCurrencyUnit
            priceCurrencyUnit: $priceCurrencyUnit
          }
        ) {
          errors {
            message
          }
          price {
            base
            offset
            currencyUnit
            formattedAmount
          }
        }
      }
    `

    it("returns data with valid inputs", async () => {
      const input = {
        amount: "100",
        amountCurrencyUnit: "BTCSAT",
        priceCurrencyUnit: "USDCENT",
      }

      const subscription = apolloClient.subscribe<PriceSubscription>({
        query: PriceDocument,
        variables: input,
      })

      const pricePublish = setTimeout(publishCurrentPrices, 1000)

      const result = (await promisifiedSubscription(subscription)) as { data }
      clearTimeout(pricePublish)
      const price_ = result.data?.price
      const { price, errors } = price_

      expect(errors.length).toEqual(0)
      expect(price).toHaveProperty("base")
      expect(price).toHaveProperty("offset")
      expect(price).toHaveProperty("formattedAmount")
      expect(price.currencyUnit).toEqual(input["priceCurrencyUnit"])
    })
  })

  describe("realtime price", () => {
    gql`
      subscription realtimePrice($currency: DisplayCurrency!) {
        realtimePrice(input: { currency: $currency }) {
          errors {
            message
          }
          realtimePrice {
            id
            timestamp
            denominatorCurrency
            btcSatPrice {
              base
              offset
              currencyUnit
            }
            usdCentPrice {
              base
              offset
              currencyUnit
            }
          }
        }
      }
    `

    it("returns data with valid inputs", async () => {
      const input = { currency: "EUR" }

      const subscription = apolloClient.subscribe<RealtimePriceSubscription>({
        query: RealtimePriceDocument,
        variables: input,
      })

      const pricePublish = setTimeout(publishCurrentPrices, 1000)

      const result = (await promisifiedSubscription(subscription)) as { data }
      clearTimeout(pricePublish)
      const price_ = result.data?.realtimePrice
      const { realtimePrice, errors } = price_

      expect(errors.length).toEqual(0)
      expect(realtimePrice).toHaveProperty("id")
      expect(realtimePrice).toHaveProperty("timestamp")
      expect(realtimePrice).toHaveProperty("denominatorCurrency", input.currency)
      expect(realtimePrice).toHaveProperty("btcSatPrice")
      expect(realtimePrice).toHaveProperty("usdCentPrice")

      expect(realtimePrice).toHaveProperty("btcSatPrice.base", expect.any(Number))
      expect(realtimePrice).toHaveProperty("btcSatPrice.offset", expect.any(Number))
      expect(realtimePrice).toHaveProperty("btcSatPrice.currencyUnit", "MINOR")

      expect(realtimePrice).toHaveProperty("usdCentPrice.base", expect.any(Number))
      expect(realtimePrice).toHaveProperty("usdCentPrice.offset", expect.any(Number))
      expect(realtimePrice).toHaveProperty("usdCentPrice.currencyUnit", "MINOR")
    })
  })

  describe("main query", () => {
    it("returns valid data", async () => {
      const { data } = await apolloClient.query<MainQueryQuery>({
        query: MainQueryDocument,
        variables: { hasToken: false },
      })
      expect(data.globals).toBeTruthy()
      expect(data.mobileVersions).toBeTruthy()
      expect(data.quizQuestions).toBeTruthy()

      expect(data?.globals?.nodesIds).toEqual(
        expect.arrayContaining([expect.any(String)]),
      )
      expect(data?.globals?.network).toEqual(BTC_NETWORK)
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
    gql`
      mutation UserRequestAuthCode($input: UserRequestAuthCodeInput!) {
        userRequestAuthCode(input: $input) {
          errors {
            message
          }
          success
        }
      }
    `

    it("success with a valid phone", async () => {
      const input = { phone }
      const result = await apolloClient.mutate<UserRequestAuthCodeMutation>({
        mutation: UserRequestAuthCodeDocument,
        variables: { input },
      })
      expect(result?.data?.userRequestAuthCode).toEqual(
        expect.objectContaining({ success: true }),
      )
    })

    it("returns error for invalid phone", async () => {
      const message = "Phone number is not a valid phone number"
      let input = { phone: "+123" }

      let result = await apolloClient.mutate({
        mutation: UserRequestAuthCodeDocument,
        variables: { input },
      })
      expect(result.data.userRequestAuthCode.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ message })]),
      )

      input = { phone: "abcd" }
      result = await apolloClient.mutate({
        mutation: UserRequestAuthCodeDocument,
        variables: { input },
      })
      expect(result.data.userRequestAuthCode.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ message })]),
      )

      input = { phone: "" }
      result = await apolloClient.mutate({
        mutation: UserRequestAuthCodeDocument,
        variables: { input },
      })
      expect(result.data.userRequestAuthCode.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ message })]),
      )
    })

    it("rate limits too many phone requests", async () => {
      await testPhoneCodeAttemptPerPhoneMinInterval(UserRequestAuthCodeDocument)
      await testPhoneCodeAttemptPerPhone(UserRequestAuthCodeDocument)
      await testPhoneCodeAttemptPerIp(UserRequestAuthCodeDocument)
    })
  })

  describe("userLogin", () => {
    it("returns a bearer token for a valid phone/code", async () => {
      const input = { phone, code: correctCode }
      const result = await apolloClient.mutate<UserLoginMutation>({
        mutation: UserLoginDocument,
        variables: { input },
      })
      expect(result?.data?.userLogin).toHaveProperty("authToken")
      expect(result?.data?.userLogin.authToken).toHaveLength(39)
    })

    it("returns error for invalid phone", async () => {
      let phone = "+1999"
      const message = "Phone number is not a valid phone number"
      let input = { phone, code: correctCode }
      let result = await apolloClient.mutate<UserLoginMutation>({
        mutation: UserLoginDocument,
        variables: { input },
      })

      expect(result?.data?.userLogin.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ message })]),
      )

      phone = "abcd"
      input = { phone, code: correctCode }
      result = await apolloClient.mutate<UserLoginMutation>({
        mutation: UserLoginDocument,
        variables: { input },
      })
      expect(result?.data?.userLogin.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ message })]),
      )

      phone = ""
      input = { phone, code: correctCode }
      result = await apolloClient.mutate<UserLoginMutation>({
        mutation: UserLoginDocument,
        variables: { input },
      })
      expect(result?.data?.userLogin.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ message })]),
      )
    })

    it("returns error for invalid code", async () => {
      let message = "Invalid or incorrect phone code entered."
      let input = { phone, code: "113566" }
      let result = await apolloClient.mutate<UserLoginMutation>({
        mutation: UserLoginDocument,
        variables: { input },
      })
      expect(result?.data?.userLogin.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ message })]),
      )

      message = "Invalid value for OneTimeAuthCode"
      input = { phone, code: "abcdef" }
      result = await apolloClient.mutate<UserLoginMutation>({
        mutation: UserLoginDocument,
        variables: { input },
      })
      expect(result?.data?.userLogin.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ message })]),
      )

      input = { phone, code: "" }
      result = await apolloClient.mutate<UserLoginMutation>({
        mutation: UserLoginDocument,
        variables: { input },
      })
      expect(result?.data?.userLogin.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ message })]),
      )
    })

    it("rate limits too many invalid login requests by IP, wrong code", async () => {
      const args = {
        input: { phone, code: "000000" as PhoneCode },
        expectedMessage: "Invalid or incorrect phone code entered.",
        mutation: UserLoginDocument,
      }
      await testRateLimitLoginByPhone(args)
      await testRateLimitLoginByIp(args)
    })

    it.skip("rate limits too many invalid login requests by IP, invalid code", async () => {
      const args = {
        input: { phone, code: "<invalid>" as PhoneCode },
        expectedMessage: "Invalid value for OneTimeAuthCode",
        mutation: UserLoginDocument,
      }
      await testRateLimitLoginByPhone(args)
      await testRateLimitLoginByIp(args)
    })

    it.skip("rate limits too many invalid login requests by IP, wrong phone", async () => {
      const args = {
        input: { phone: "+19999999999" as PhoneNumber, code: correctCode },
        expectedMessage: "Phone number is not a valid phone number",
        mutation: UserLoginDocument,
      }
      await testRateLimitLoginByPhone(args)
      await testRateLimitLoginByIp(args)
    })

    it.skip("rate limits too many invalid login requests by IP, invalid phone", async () => {
      const args = {
        input: { phone: "<invalid>" as PhoneNumber, code: correctCode },
        expectedMessage: "Phone number is not a valid phone number",
        mutation: UserLoginDocument,
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
  await clearLimiters()

  // Exhaust limiter
  const input = { phone }
  for (let i = 0; i < points; i++) {
    await clearLimitersWithExclusions([
      RateLimitPrefix.requestPhoneCodeAttemptPerPhoneMinInterval,
    ])

    const {
      data: {
        userRequestAuthCode: { success },
      },
    } = await apolloClient.mutate({ mutation, variables: { input } })
    expect(success).toBeTruthy()
  }

  // Check limiter is exhausted
  const {
    data: {
      userRequestAuthCode: { errors },
    },
  } = await apolloClient.mutate({ mutation, variables: { input } })

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
  await clearLimiters()

  // Exhaust limiter
  const input = { phone }
  for (let i = 0; i < points; i++) {
    await clearLimitersWithExclusions([RateLimitPrefix.requestPhoneCodeAttemptPerPhone])

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
  const {
    data: {
      userRequestAuthCode: { errors },
    },
  } = await apolloClient.mutate({ mutation, variables: { input } })
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
  await clearLimiters()

  // Exhaust limiter
  const input = { phone }
  for (let i = 0; i < points; i++) {
    await clearLimitersWithExclusions([RateLimitPrefix.requestPhoneCodeAttemptPerIp])

    const response = await apolloClient.mutate({ mutation, variables: { input } })
    const {
      data: {
        userRequestAuthCode: { success },
      },
    } = response
    expect(success).toBeTruthy()
  }

  // Check limiter is exhausted

  const expectedErrorMessage =
    "Too many phone code attempts on same network, please wait for a while and try again."
  const {
    data: {
      userRequestAuthCode: { errors },
    },
  } = await apolloClient.mutate({ mutation, variables: { input } })
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
  // Fetch limiter config
  const {
    limits: { points },
    error,
  } = RateLimitConfig.failedLoginAttemptPerPhone

  // Reset limiter
  await clearLimiters()

  // Exhaust limiter
  for (let i = 0; i < points; i++) {
    await clearLimitersWithExclusions([RateLimitPrefix.failedLoginAttemptPerPhone])

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
  // Fetch limiter config
  const {
    limits: { points },
    error,
  } = RateLimitConfig.failedLoginAttemptPerIp

  // Reset limiter
  await clearLimiters()

  // Exhaust limiter
  for (let i = 0; i < points; i++) {
    await clearLimitersWithExclusions([RateLimitPrefix.failedLoginAttemptPerIp])

    const result = await apolloClient.mutate({ mutation, variables: { input } })
    expect(result.data.userLogin.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ message: expectedMessage })]),
    )
  }

  const expectedErrorMessage =
    "Too many login attempts on same network, please wait for a while and try again."
  const result = await apolloClient.mutate({ mutation, variables: { input } })
  expect(new error()).toBeInstanceOf(UserLoginIpRateLimiterExceededError)
  expect(result.data.userLogin.errors).toEqual(
    expect.arrayContaining([expect.objectContaining({ message: expectedErrorMessage })]),
  )
}
