declare const phoneNumberSymbol: unique symbol
type PhoneNumber = string & { [phoneNumberSymbol]: never }

declare const phoneCodeSymbol: unique symbol
type PhoneCode = string & { [phoneCodeSymbol]: never }

type UserLanguage =
  typeof import("./index").UserLanguage[keyof typeof import("./index").UserLanguage]

declare const deviceTokenSymbol: unique symbol
type DeviceToken = string & { [deviceTokenSymbol]: never }

declare const contactAliasSymbol: unique symbol
type ContactAlias = string & { [contactAliasSymbol]: never }

declare const quizQuestionIdSymbol: unique symbol
type QuizQuestionId = string & { [quizQuestionIdSymbol]: never }

type UserContact = {
  readonly id: Username
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

type PhoneMetadata = {
  // from twilio
  carrier: {
    error_code: string // check this is the right syntax
    mobile_country_code: string
    mobile_network_code: string
    name: string
    type: "landline" | "voip" | "mobile"
  }
  countryCode: string
}

type User = {
  readonly id: UserId
  readonly username: Username
  readonly walletPublicId: WalletPublicId
  readonly contacts: UserContact[]
  readonly quizQuestions: UserQuizQuestion[]
  readonly defaultAccountId: AccountId
  readonly deviceTokens: DeviceToken[]
  readonly createdAt: Date
  readonly phone: PhoneNumber
  readonly twilio: PhoneMetadata | null
  language: UserLanguage
  twoFA: TwoFAForUser
}

type NewUserInfo = {
  phone: PhoneNumber
  twilio?: PhoneMetadata
}

interface IUsersRepository {
  findById(userId: UserId): Promise<User | RepositoryError>
  findByUsername(username: Username): Promise<User | RepositoryError>
  findByPhone(phone: PhoneNumber): Promise<User | RepositoryError>
  persistNew({ phone, twilio }: NewUserInfo): Promise<User | RepositoryError>
  findByWalletPublicId(walletPublicId: WalletPublicId): Promise<User | RepositoryError>
  update(user: User): Promise<User | RepositoryError>
}
