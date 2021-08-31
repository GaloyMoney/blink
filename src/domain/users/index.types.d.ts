declare const phoneNumberSymbol: unique symbol
type PhoneNumber = string & { [phoneNumberSymbol]: never }

type UserLanguage =
  typeof import("./index").UserLanguage[keyof typeof import("./index").UserLanguage]

declare const deviceTokenSymbol: unique symbol
type DeviceToken = number & { [deviceTokenSymbol]: never }

declare const contactAliasSymbol: unique symbol
type ContactAlias = string & { [contactAliasSymbol]: never }

declare const quizQuestionIdSymbol: unique symbol
type QuizQuestionId = string & { [quizQuestionIdSymbol]: never }

type WalletContact = {
  walletName: WalletName
  alias: ContactAlias
  transactionsCount: number
}

type QuizQuestion = {
  id: QuizQuestionId
  earnAmount: Satoshis
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
  contacts: WalletContact[]
  quizQuestions: UserQuizQuestion[]
  defaultAccountId: AccountId
  deviceTokens: DeviceToken[]
  createdAt: Date
}

interface IUsersRepository {
  findById(userId: UserId): Promise<User | RepositoryError>
  update(user: User): Promise<User | RepositoryError>
}
