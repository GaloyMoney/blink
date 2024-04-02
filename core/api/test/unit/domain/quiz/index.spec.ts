import { fillQuizInformation } from "@/domain/quiz"

describe("quiz", () => {
  it("completed is false by default", () => {
    const result = fillQuizInformation([]).quizzes
    expect(result.find((quiz) => quiz.completed === true)).toBe(undefined)
  })

  it("default value when not started", () => {
    const filledInfo = fillQuizInformation([])
    expect(filledInfo.currentSection).toBe(0)
    expect(filledInfo.quizzes[0].notBefore).toBe(undefined)
  })

  it("test that we are on section 0 after 1 element has been completed", () => {
    const quizCompleted = { quizId: "sat" as QuizQuestionId, createdAt: new Date() }
    const filledInfo = fillQuizInformation([quizCompleted])

    expect(filledInfo.quizzes.find((quiz) => quiz.completed === true)).toEqual({
      amount: 1,
      completed: true,
      id: "sat",
      section: 0,
      notBefore: undefined,
    })

    expect(filledInfo.currentSection).toBe(0)
  })

  it("test that we are on section 0 after 2 elements has been completed", () => {
    const quizzesCompleted = [
      { quizId: "sat" as QuizQuestionId, createdAt: new Date() },
      { quizId: "whereBitcoinExist" as QuizQuestionId, createdAt: new Date() },
    ]
    const filledInfo = fillQuizInformation(quizzesCompleted)

    expect(filledInfo.quizzes.filter((quiz) => quiz.completed === true)).toEqual([
      {
        amount: 1,
        completed: true,
        id: "sat",
        section: 0,
        notBefore: undefined,
      },
      {
        amount: 1,
        completed: true,
        id: "whereBitcoinExist",
        section: 0,
        notBefore: undefined,
      },
    ])

    expect(filledInfo.currentSection).toBe(0)
  })

  it("move to section 1 once all elements from 0 are completed", () => {
    const quizzesCompleted = [
      { quizId: "whatIsBitcoin" as QuizQuestionId, createdAt: new Date() },
      { quizId: "sat" as QuizQuestionId, createdAt: new Date() },
      { quizId: "whereBitcoinExist" as QuizQuestionId, createdAt: new Date() },
      { quizId: "whoControlsBitcoin" as QuizQuestionId, createdAt: new Date() },
      { quizId: "copyBitcoin" as QuizQuestionId, createdAt: new Date() },
    ]
    const filledInfo = fillQuizInformation(quizzesCompleted)
    expect(filledInfo.currentSection).toBe(1)

    expect(filledInfo.quizzes[4].notBefore).toBeUndefined()
    expect(filledInfo.quizzes[5].notBefore?.getTime()).toBeCloseTo(
      new Date().getTime() + 12 * 60 * 60 * 1000,
      -3,
    )
  })

  it("stay at section 1 when only some section 1 element are completed", () => {
    const quizzesCompleted = [
      { quizId: "whatIsBitcoin" as QuizQuestionId, createdAt: new Date() },
      { quizId: "sat" as QuizQuestionId, createdAt: new Date() },
      { quizId: "whereBitcoinExist" as QuizQuestionId, createdAt: new Date() },
      { quizId: "whoControlsBitcoin" as QuizQuestionId, createdAt: new Date() },
      { quizId: "copyBitcoin" as QuizQuestionId, createdAt: new Date() },
      { quizId: "moneySocialAgreement" as QuizQuestionId, createdAt: new Date() },
      { quizId: "coincidenceOfWants" as QuizQuestionId, createdAt: new Date() },
    ]
    const filledInfo = fillQuizInformation(quizzesCompleted)
    expect(filledInfo.currentSection).toBe(1)

    expect(filledInfo.quizzes[4].notBefore).toBeUndefined()
    expect(filledInfo.quizzes[5].notBefore).toBeUndefined()
    expect(filledInfo.quizzes[7].notBefore?.getTime()).toBeCloseTo(
      new Date().getTime() + 12 * 60 * 60 * 1000,
      -3,
    )
  })

  it("move to section 2 once all section 1 element are completed", () => {
    const quizzesCompleted = [
      { quizId: "whatIsBitcoin" as QuizQuestionId, createdAt: new Date() },
      { quizId: "sat" as QuizQuestionId, createdAt: new Date() },
      { quizId: "whereBitcoinExist" as QuizQuestionId, createdAt: new Date() },
      { quizId: "whoControlsBitcoin" as QuizQuestionId, createdAt: new Date() },
      { quizId: "copyBitcoin" as QuizQuestionId, createdAt: new Date() },
      { quizId: "moneySocialAgreement" as QuizQuestionId, createdAt: new Date() },
      { quizId: "coincidenceOfWants" as QuizQuestionId, createdAt: new Date() },
      { quizId: "moneyEvolution" as QuizQuestionId, createdAt: new Date() },
      { quizId: "whyStonesShellGold" as QuizQuestionId, createdAt: new Date() },
      { quizId: "moneyIsImportant" as QuizQuestionId, createdAt: new Date() },
      { quizId: "moneyImportantGovernement" as QuizQuestionId, createdAt: new Date() },
    ]
    const filledInfo = fillQuizInformation(quizzesCompleted)
    expect(filledInfo.currentSection).toBe(2)

    expect(filledInfo.quizzes[4].notBefore).toBeUndefined()
    expect(filledInfo.quizzes[5].notBefore).toBeUndefined()
    expect(filledInfo.quizzes[11].notBefore?.getTime()).toBeCloseTo(
      new Date().getTime() + 12 * 60 * 60 * 1000,
      -3,
    )
  })

  it("can only do next session when Date is older than 12 hours", () => {
    const dateFromLastWeek = new Date()
    dateFromLastWeek.setDate(dateFromLastWeek.getDate() - 7)

    const quizzesCompleted = [
      { quizId: "whatIsBitcoin" as QuizQuestionId, createdAt: dateFromLastWeek },
      { quizId: "sat" as QuizQuestionId, createdAt: dateFromLastWeek },
      { quizId: "whereBitcoinExist" as QuizQuestionId, createdAt: dateFromLastWeek },
      { quizId: "whoControlsBitcoin" as QuizQuestionId, createdAt: dateFromLastWeek },
      { quizId: "copyBitcoin" as QuizQuestionId, createdAt: dateFromLastWeek },
    ]
    const filledInfo = fillQuizInformation(quizzesCompleted)
    expect(filledInfo.currentSection).toBe(1)

    expect(filledInfo.quizzes[4].notBefore).toBeUndefined()

    const currentQuiz = filledInfo.quizzes[5]
    expect(currentQuiz.notBefore?.getTime()).toBeCloseTo(
      dateFromLastWeek.getTime() + 12 * 60 * 60 * 1000,
      -3,
    )
    expect(currentQuiz.notBefore && currentQuiz.notBefore > new Date()).toBe(false)
  })

  it("check that the algo use most recent date properly", () => {
    const dateFromLastWeek = new Date()
    dateFromLastWeek.setDate(dateFromLastWeek.getDate() - 7)

    const dateFromLastHour = new Date()
    dateFromLastHour.setHours(dateFromLastHour.getHours() - 1)

    const quizzesCompleted = [
      { quizId: "sat" as QuizQuestionId, createdAt: dateFromLastWeek },
      { quizId: "whereBitcoinExist" as QuizQuestionId, createdAt: dateFromLastWeek },
      { quizId: "whoControlsBitcoin" as QuizQuestionId, createdAt: dateFromLastWeek },
      { quizId: "copyBitcoin" as QuizQuestionId, createdAt: dateFromLastWeek },
      { quizId: "moneySocialAgreement" as QuizQuestionId, createdAt: dateFromLastHour },
      { quizId: "coincidenceOfWants" as QuizQuestionId, createdAt: dateFromLastHour },
      { quizId: "moneyEvolution" as QuizQuestionId, createdAt: dateFromLastHour },
      { quizId: "whyStonesShellGold" as QuizQuestionId, createdAt: dateFromLastHour },
      { quizId: "moneyIsImportant" as QuizQuestionId, createdAt: dateFromLastHour },
      {
        quizId: "moneyImportantGovernement" as QuizQuestionId,
        createdAt: dateFromLastHour,
      },
      { quizId: "whatIsBitcoin" as QuizQuestionId, createdAt: dateFromLastWeek },
    ]
    const filledInfo = fillQuizInformation(quizzesCompleted)
    expect(filledInfo.currentSection).toBe(2)

    const currentQuiz = filledInfo.quizzes[11]
    expect(currentQuiz.notBefore?.getTime()).toBeCloseTo(
      dateFromLastHour.getTime() + 12 * 60 * 60 * 1000,
      -3,
    )
    expect(currentQuiz.notBefore && currentQuiz.notBefore > new Date()).toBe(true)
  })

  it("ensure notBefore date is calculated correctly - based on the last one from previous section", () => {
    const dateFromLastWeek = new Date()
    dateFromLastWeek.setDate(dateFromLastWeek.getDate() - 7)

    const dateFromLastHour = new Date()
    dateFromLastHour.setHours(dateFromLastHour.getHours() - 1)

    const quizzesCompleted = [
      { quizId: "whatIsBitcoin" as QuizQuestionId, createdAt: dateFromLastWeek },
      { quizId: "sat" as QuizQuestionId, createdAt: dateFromLastWeek },
      { quizId: "whereBitcoinExist" as QuizQuestionId, createdAt: dateFromLastWeek },
      { quizId: "whoControlsBitcoin" as QuizQuestionId, createdAt: dateFromLastWeek },
      { quizId: "copyBitcoin" as QuizQuestionId, createdAt: dateFromLastWeek },
      { quizId: "moneySocialAgreement" as QuizQuestionId, createdAt: dateFromLastHour },
    ]

    const filledInfo = fillQuizInformation(quizzesCompleted)
    expect(filledInfo.currentSection).toBe(1)

    console.log(filledInfo.quizzes[5])
    console.log(filledInfo.quizzes[6])
    console.log(filledInfo.quizzes[7])

    const currentQuiz = filledInfo.quizzes[6]
    expect(currentQuiz.notBefore?.getTime()).toBeCloseTo(
      dateFromLastWeek.getTime() + 12 * 60 * 60 * 1000,
      -3,
    )

    expect(currentQuiz.notBefore && currentQuiz.notBefore > new Date()).toBe(false)
  })
})
