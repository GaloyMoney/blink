type PhoneNumber = string & { readonly brand: unique symbol }
type PhoneCode = string & { readonly brand: unique symbol }

type KratosUserId = string & { readonly brand: unique symbol }
type EmailAddress = string & { readonly brand: unique symbol }

type UserLanguage = typeof import("./languages").Languages[number]

type DeviceToken = string & { readonly brand: unique symbol }

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
  readonly defaultAccountId: AccountId
  readonly deviceTokens: DeviceToken[]
  readonly createdAt: Date
  readonly phone?: PhoneNumber
  readonly phoneMetadata?: PhoneMetadata
  language: UserLanguage
  twoFA: TwoFAForUser
}

type NewUserInfo = {
  phone: PhoneNumber
  phoneMetadata?: PhoneMetadata
}

type PhoneMetadataValidator = {
  validateForReward(phoneMetadata?: PhoneMetadata): true | ValidationError
}

interface IUsersRepository {
  findById(userId: UserId): Promise<User | RepositoryError>
  findByPhone(phone: PhoneNumber): Promise<User | RepositoryError>
  persistNew({ phone, phoneMetadata }: NewUserInfo): Promise<User | RepositoryError>
  update(user: User): Promise<User | RepositoryError>
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface ReadonlyArray<T> {
  includes<S, R extends `${Extract<S, string>}`>(
    this: ReadonlyArray<R>,
    searchElement: S,
    fromIndex?: number,
  ): searchElement is R & S
}
