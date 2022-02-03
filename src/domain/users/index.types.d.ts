type PhoneNumber = string & { readonly brand: unique symbol }
type PhoneCode = string & { readonly brand: unique symbol }
type UserLanguage =
  typeof import("./index").UserLanguage[keyof typeof import("./index").UserLanguage]

type DeviceToken = string & { readonly brand: unique symbol }
type QuizQuestionId = string & { readonly brand: unique symbol }

type QuizQuestion = {
  readonly id: QuizQuestionId
  readonly earnAmount: Satoshis
}

type UserQuizQuestion = {
  readonly question: QuizQuestion
  completed: boolean
}

// TODO: move to camelCase base // migration needed
// type PhoneMetadata = {
//   carrier: {
//     errorCode: string | undefined // check this is the right syntax
//     mobileCountryCode: string | undefined
//     mobileNetworkCode: string | undefined
//     name: string | undefined
//     type: "landline" | "voip" | "mobile"
//   }
//   countryCode: string | undefined
// }

type CarrierType =
  typeof import("../phone-provider/index").CarrierType[keyof typeof import("../phone-provider/index").CarrierType]

type PhoneMetadata = {
  // from twilio
  carrier: {
    error_code: string // check this is the right syntax
    mobile_country_code: string
    mobile_network_code: string
    name: string
    type: CarrierType
  }
  countryCode: string
}

type User = {
  readonly id: UserId
  readonly quizQuestions: UserQuizQuestion[]
  readonly defaultAccountId: AccountId
  readonly deviceTokens: DeviceToken[]
  readonly createdAt: Date
  readonly phone: PhoneNumber
  readonly phoneMetadata: PhoneMetadata | null
  readonly isEditor: boolean
  language: UserLanguage
  twoFA: TwoFAForUser
}

type NewUserInfo = {
  phone: PhoneNumber
  phoneMetadata: PhoneMetadata | null
}

type PhoneMetadataValidator = {
  validate(phoneMetadata: PhoneMetadata | null): true | ApplicationError
}

interface IUsersRepository {
  findById(userId: UserId): Promise<User | RepositoryError>
  findByPhone(phone: PhoneNumber): Promise<User | RepositoryError>
  persistNew({ phone, phoneMetadata }: NewUserInfo): Promise<User | RepositoryError>
  update(user: User): Promise<User | RepositoryError>
}
