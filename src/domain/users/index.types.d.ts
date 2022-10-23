type PhoneNumber = string & { readonly brand: unique symbol }
type PhoneCode = string & { readonly brand: unique symbol }

type EmailAddress = string & { readonly brand: unique symbol }

type UserLanguage = typeof import("./languages").Languages[number]
type UserLanguageOrEmpty = UserLanguage | ""

type DeviceToken = string & { readonly brand: unique symbol }

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

type PhoneMetadataValidator = {
  validateForReward(phoneMetadata?: PhoneMetadata): true | ValidationError
}

type SetPhoneMetadataArgs = {
  id: KratosUserId
  phoneMetadata: PhoneMetadata
}

type SetDeviceTokensArgs = {
  id: KratosUserId
  deviceTokens: DeviceToken[]
}

type SetLanguageArgs = {
  id: KratosUserId
  language: UserLanguageOrEmpty
}

type User = {
  id: KratosUserId
  languageOrDefault: UserLanguage
  language: UserLanguageOrEmpty
  deviceTokens: DeviceToken[]
  phoneMetadata: PhoneMetadata | undefined
}

type UserUpdateInput = Omit<Partial<User>, "language"> & {
  id: KratosUserId
} & {
  language?: UserLanguageOrEmpty
}

interface IUserRepository {
  findById(id: KratosUserId): Promise<User | RepositoryError>
  list(): Promise<User[] | RepositoryError>
  update(user: UserUpdateInput): Promise<User | RepositoryError>
}
