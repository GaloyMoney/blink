declare const phoneNumberSymbol: unique symbol
type PhoneNumber = string & { [phoneNumberSymbol]: never }

type UserLanguage =
  typeof import("./index").UserLanguage[keyof typeof import("./index").UserLanguage]

declare const deviceTokenSymbol: unique symbol
type DeviceToken = string & { [deviceTokenSymbol]: never }

declare const twoFASecretSymbol: unique symbol
type TwoFASecret = string & { [twoFASecretSymbol]: never }

declare const contactAliasSymbol: unique symbol
type ContactAlias = string & { [contactAliasSymbol]: never }

declare const quizQuestionIdSymbol: unique symbol
type QuizQuestionId = string & { [quizQuestionIdSymbol]: never }

type WalletContact = {
  readonly walletName: WalletName
  alias: ContactAlias
  transactionsCount: number
}

type QuizQuestion = {
  readonly id: QuizQuestionId
  readonly earnAmount: Satoshis
}

type UserQuizQuestion = {
  readonly question: QuizQuestion
  completed: boolean
}

type User = {
  readonly id: UserId
  readonly contacts: WalletContact[]
  readonly quizQuestions: UserQuizQuestion[]
  readonly defaultAccountId: AccountId
  readonly deviceTokens: DeviceToken[]
  readonly lastIPs: IPType[]
  phone: PhoneNumber
  language: UserLanguage
  lastConnection: Date
  twoFA: TwoFA
}

interface IUsersRepository {
  findById(userId: UserId): Promise<User | RepositoryError>
  update(user: User): Promise<User | RepositoryError>
}
