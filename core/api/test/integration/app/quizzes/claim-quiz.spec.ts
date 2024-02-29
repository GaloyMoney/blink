import crypto from "crypto"

import { Quiz } from "@/app"

import { InvalidIpMetadataError } from "@/domain/errors"
import {
  RateLimiterExceededError,
  AddQuizAttemptIpRateLimiterExceededError,
} from "@/domain/rate-limit/errors"

import * as RateLimitImpl from "@/services/rate-limit"

import { RateLimitConfig } from "@/domain/rate-limit"

afterEach(async () => {
  jest.restoreAllMocks()
})

describe("addQuiz", () => {
  it("fails if ip is undefined", async () => {
    const result = await Quiz.claimQuiz({
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
          keyPrefix: RateLimitConfig.addQuizAttemptPerIp.key,
          limitOptions: RateLimitConfig.addQuizAttemptPerIp.limits,
        }),
        consume: () => new RateLimiterExceededError(),
      })

    const result = await Quiz.claimQuiz({
      accountId: crypto.randomUUID() as AccountId,
      quizQuestionId: "fakeQuizQuestionId",
      ip: "192.168.13.13" as IpAddress,
    })

    expect(result).toBeInstanceOf(AddQuizAttemptIpRateLimiterExceededError)

    // Restore system state
    rateLimitServiceSpy.mockReset()
  })
})
