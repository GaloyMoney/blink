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

const orderedKeys = Object.keys(QuizzesValue)

const reorderQuizzes = (quizzesCompleted: QuizCompleted[]) => {
  return quizzesCompleted.sort((a, b) => {
    const indexA = orderedKeys.indexOf(a.quizId)
    const indexB = orderedKeys.indexOf(b.quizId)
    return indexA - indexB
  })
}

const lastSectionCompleted = (orderedQuizzes: QuizCompleted[]): number => {
  const lastQuizCompleted = orderedQuizzes[orderedQuizzes.length - 1]?.quizId

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
  const orderedQuizzes = reorderQuizzes(quizzesCompleted)
  const currentSection = lastSectionCompleted(orderedQuizzes)

  const quizzes = Object.entries(QuizzesValue).map(([id, amount]) => {
    const quizCompleted = orderedQuizzes.find((quiz) => quiz.quizId === id)
    const section =
      QuizzesSections.find((section) => section.quiz.includes(id as QuizQuestionId))
        ?.order ?? NaN

    const completed = !!quizCompleted

    let notBefore: Date | undefined = undefined
    if (section !== 0 && !completed) {
      const lastQuizCreatedAt =
        orderedQuizzes[orderedQuizzes.length - 1]?.createdAt ?? new Date()

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
