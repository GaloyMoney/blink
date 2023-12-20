import crypto from "crypto"

import { QuizAlreadyPresentError } from "@/domain/errors"
import { QuizRepository } from "@/services/mongoose"

describe("QuizRepository", () => {
  const accountId = crypto.randomUUID() as AccountId
  const quizQuestionId = "fakeQuizQuestionId" as QuizQuestionId

  it("add quiz", async () => {
    const result = await QuizRepository(accountId).add(quizQuestionId)
    expect(result).toBe(true)
  })

  it("can't add quiz twice", async () => {
    const result = await QuizRepository(accountId).add(quizQuestionId)
    expect(result).toBeInstanceOf(QuizAlreadyPresentError)
  })

  it("fetch quiz", async () => {
    const result = await QuizRepository(accountId).fetchAll()
    expect(result).toHaveLength(1)
  })

  it("fetch quizzes", async () => {
    const quiz2 = "fakeQuizQuestionId2" as QuizQuestionId
    await QuizRepository(accountId).add(quiz2)

    const result = await QuizRepository(accountId).fetchAll()
    expect(result).toMatchObject([
      {
        accountId,
        quizId: quizQuestionId,
      },
      {
        accountId,
        quizId: quiz2,
      },
    ])
  })
})
