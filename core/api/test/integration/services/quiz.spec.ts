import crypto from "crypto"

import { QuizAlreadyPresentError } from "@/domain/errors"
import { QuizRepository } from "@/services/mongoose"
import { QuizQuestionId } from "@/domain/quiz/index.types"

describe("QuizRepository", () => {
  const accountId = crypto.randomUUID() as AccountId
  const quizId = "fakeQuizQuestionId" as QuizQuestionId

  it("add quiz", async () => {
    const result = await QuizRepository().add({ quizId, accountId })
    expect(result).toBe(true)
  })

  it("can't add quiz twice", async () => {
    const result = await QuizRepository().add({ quizId, accountId })
    expect(result).toBeInstanceOf(QuizAlreadyPresentError)
  })

  it("fetch quiz", async () => {
    const result = await QuizRepository().fetchAll(accountId)
    expect(result).toHaveLength(1)
  })

  it("fetch quizzes", async () => {
    const quiz2 = "fakeQuizQuestionId2" as QuizQuestionId
    await QuizRepository().add({ accountId, quizId: quiz2 })

    const result = await QuizRepository().fetchAll(accountId)
    expect(result).toMatchObject([
      {
        quizId: quizId,
      },
      {
        quizId: quiz2,
      },
    ])
  })
})
