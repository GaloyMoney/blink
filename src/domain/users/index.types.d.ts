declare const phoneNumberSymbol: unique symbol
type PhoneNumber = string & { [phoneNumberSymbol]: never }

type UserLanguage =
  typeof import("./index").UserLanguage[keyof typeof import("./index").UserLanguage]

declare const deviceTokenSymbol: unique symbol
type DeviceToken = number & { [deviceTokenSymbol]: never }

type UserContact = {
  id: string
  name: string
  transactionsCount: number
}

type QuizQuestion = {
  id: string
  earnAmount: number
}

type UserQuizQuestion = {
  question: QuizQuestion
  completed: boolean
}

type User = {
  id: UserId
  username: Username | null
  phone: PhoneNumber
  language: UserLanguage
  contacts: UserContact[]
  quizQuestions: UserQuizQuestion[]
  defaultAccountId: AccountId
  deviceToken: DeviceToken[]
  createdAt: Date
}

interface IUsersRepository {
  findById(userId: UserId): Promise<User | RepositoryError>
}
