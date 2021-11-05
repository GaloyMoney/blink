declare const phoneNumberSymbol: unique symbol
type PhoneNumber = string & { [phoneNumberSymbol]: never }

type UserLanguage =
  typeof import("./index").UserLanguage[keyof typeof import("./index").UserLanguage]

declare const deviceTokenSymbol: unique symbol
type DeviceToken = string & { [deviceTokenSymbol]: never }

declare const contactAliasSymbol: unique symbol
type ContactAlias = string & { [contactAliasSymbol]: never }

declare const quizQuestionIdSymbol: unique symbol
type QuizQuestionId = string & { [quizQuestionIdSymbol]: never }

type UserContact = {
  readonly username: Username
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
  readonly username: Username
  readonly walletPublicId: WalletPublicId
  readonly contacts: UserContact[]
  readonly quizQuestions: UserQuizQuestion[]
  readonly defaultAccountId: AccountId
  readonly deviceTokens: DeviceToken[]
  readonly lastIPs: IPType[]
  readonly createdAt: Date
  readonly status: AccountStatus
  phone: PhoneNumber
  language: UserLanguage
  lastConnection: Date
  twoFA: TwoFAForUser
}

interface IUsersRepository {
  findById(userId: UserId): Promise<User | RepositoryError>
  updateIps(userId: UserId, iPs: IPType[]): Promise<null | RepositoryError>
  findByIdAndUpdateLastConnectionDate(
    userId: UserId,
    findByIdAndUpdateLastConnectionDate: Date,
  ): Promise<User | RepositoryError>
  findByUsername(username: Username): Promise<User | RepositoryError>
  findByWalletPublicId(walletPublicId: WalletPublicId): Promise<User | RepositoryError>
  update(user: User): Promise<User | RepositoryError>
}

type Ip = string
