import crypto from "crypto"

import { Payments } from "@/app"

import { InvalidIpMetadataError } from "@/domain/errors"
import {
  RateLimiterExceededError,
  UserAddEarnAttemptIpRateLimiterExceededError,
} from "@/domain/rate-limit/errors"

import * as RateLimitImpl from "@/services/rate-limit"

import { RateLimitConfig } from "@/domain/rate-limit"

afterEach(async () => {
  jest.restoreAllMocks()
})

describe("addEarn", () => {
  it("fails if ip is undefined", async () => {
    const result = await Payments.addEarn({
      accountId: crypto.randomUUID() as AccountId,
      quizQuestionId: "fakeQuizQuestionId",
      ip: undefined,
    })
    expect(result).toBeInstanceOf(InvalidIpMetadataError)
  })

  it("fails if ip limit hit", async () => {
    // Setup limiter mock
    const { RedisRateLimitService } = jest.requireActual("@/services/rate-limit")
    const rateLimitServiceSpy = jest
      .spyOn(RateLimitImpl, "RedisRateLimitService")
      .mockReturnValue({
        ...RedisRateLimitService({
          keyPrefix: RateLimitConfig.addEarnAttemptPerIp.key,
          limitOptions: RateLimitConfig.addEarnAttemptPerIp.limits,
        }),
        consume: () => new RateLimiterExceededError(),
      })

    const result = await Payments.addEarn({
      accountId: crypto.randomUUID() as AccountId,
      quizQuestionId: "fakeQuizQuestionId",
      ip: "192.168.13.13" as IpAddress,
    })

    expect(result).toBeInstanceOf(UserAddEarnAttemptIpRateLimiterExceededError)

    // Restore system state
    rateLimitServiceSpy.mockReset()
  })
})
