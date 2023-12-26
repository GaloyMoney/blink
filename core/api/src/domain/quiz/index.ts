export * from "./config"

import { QuizzesValue, milliSecondsBetweenSections } from "./config"
import { QuizzesSectionsConfig } from "./sections"

export interface QuizCompleted {
  quizId: QuizQuestionId
  createdAt: Date
}

export const QuizzesSections = QuizzesSectionsConfig.map((value, index) => ({
  order: index,
  ...value,
}))

type FillQuizInformationResult = {
  currentSection: number
  quizzes: {
    id: QuizQuestionId
    amount: Satoshis
    completed: boolean
    section: number
    notBefore: Date | undefined
  }[]
}

const lastSectionCompleted = (quizzesCompleted: QuizCompleted[]): number => {
  const quizzesCompletedIds = quizzesCompleted.map((quiz) => quiz.quizId)
  const lastQuizCompleted = quizzesCompletedIds[quizzesCompletedIds.length - 1]

  // which section are we?
  const index = QuizzesSections.findIndex((section) =>
    section.quiz.includes(lastQuizCompleted),
  )

  // if we completed the last quiz of the current section, we move to the next
  const section = QuizzesSections[index]?.quiz
  if (section && section[section.length - 1] === lastQuizCompleted) return index + 1

  return index === -1 ? 0 : index
}

export const fillQuizInformation = (
  quizzesCompleted: QuizCompleted[],
): FillQuizInformationResult => {
  const currentSection = lastSectionCompleted(quizzesCompleted)

  const quizzes = Object.entries(QuizzesValue).map(([id, amount]) => {
    const quizCompleted = quizzesCompleted.find((quiz) => quiz.quizId === id)
    const section =
      QuizzesSections.find((section) => section.quiz.includes(id as QuizQuestionId))
        ?.order ?? NaN

    const lastQuizCreatedAt =
      quizzesCompleted[quizzesCompleted.length - 1]?.createdAt ?? new Date()

    const completed = Boolean(quizCompleted)

    let notBefore: Date | undefined = undefined
    if (section !== 0 && !completed) {
      notBefore = new Date(lastQuizCreatedAt.getTime() + milliSecondsBetweenSections)
    }

    return {
      id: id as QuizQuestionId,
      amount,
      completed,
      section,
      notBefore,
    }
  })

  return {
    currentSection,
    quizzes,
  }
}
