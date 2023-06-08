type PhoneNumber = string & { readonly brand: unique symbol }
type PhoneCode = string & { readonly brand: unique symbol }

type EmailAddress = string & { readonly brand: unique symbol }

type UserLanguage = typeof import("./languages").Languages[number]
type UserLanguageOrEmpty = UserLanguage | ""

type DeviceToken = string & { readonly brand: unique symbol }

type CarrierType =
  typeof import("../phone-provider/index").CarrierType[keyof typeof import("../phone-provider/index").CarrierType]

type ChannelType =
  typeof import("../phone-provider/index").ChannelType[keyof typeof import("../phone-provider/index").ChannelType]

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
  id: UserId
  phoneMetadata: PhoneMetadata
}

type SetDeviceTokensArgs = {
  id: UserId
  deviceTokens: DeviceToken[]
}

type SetLanguageArgs = {
  id: UserId
  language: UserLanguageOrEmpty
}

type User = {
  id: UserId
  language: UserLanguageOrEmpty
  deviceTokens: DeviceToken[]
  phoneMetadata: PhoneMetadata | undefined
  phone?: PhoneNumber | undefined
  createdAt: Date
  deviceId?: UserId | undefined
}

type UserUpdateInput = Omit<Partial<User>, "language"> & {
  id: UserId
} & {
  language?: UserLanguageOrEmpty
}

interface IUsersRepository {
  findById(id: UserId): Promise<User | RepositoryError>
  findByPhone(phone: PhoneNumber): Promise<User | RepositoryError>
  update(user: UserUpdateInput): Promise<User | RepositoryError>
  adminUnsetPhoneForUserPreservation(id: UserId): Promise<User | RepositoryError>
  migrateUserIdSubject({
    currentUserIdSubject,
    newUserIdSubject,
    phone,
  }): Promise<User | RepositoryError>
}
