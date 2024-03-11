type PhoneNumber = string & { readonly brand: unique symbol }
type PhoneCode = string & { readonly brand: unique symbol }

type EmailAddress = string & { readonly brand: unique symbol }
type EmailCode = string & { readonly brand: unique symbol }

type LoginIdentifier = PhoneNumber | EmailAddress | HashedAuthToken

type DeviceId = string & { readonly brand: unique symbol }

type UserLanguage = (typeof import("./languages").Languages)[number]
type UserLanguageOrEmpty = UserLanguage | ""

type DeviceToken = string & { readonly brand: unique symbol }

type CarrierType =
  (typeof import("../phone-provider/index").CarrierType)[keyof typeof import("../phone-provider/index").CarrierType]

type ChannelType =
  (typeof import("../phone-provider/index").ChannelType)[keyof typeof import("../phone-provider/index").ChannelType]

type PhoneMetadata = {
  // from twilio
  carrier: {
    error_code: string | null
    mobile_country_code: string | null
    mobile_network_code: string | null
    name: string | null
    type: CarrierType | null
  }
  countryCode: string
}

type PhoneMetadataAuthorizer = {
  authorize(phoneMetadata?: PhoneMetadata): true | AuthorizationError
}

type PhoneMetadataValidator = {
  validate(
    rawPhoneMetadata: Record<string, string | Record<string, string | null>>,
  ): PhoneMetadata | ValidationError
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
  phoneMetadata: PhoneMetadata | undefined
  phone?: PhoneNumber | undefined
  deletedPhones?: PhoneNumber[]
  createdAt: Date
  deviceId?: DeviceId | undefined
  deletedEmails?: EmailAddress[] | undefined
}

type UserUpdateInput = Omit<Partial<User>, "createdAt"> & {
  id: UserId
}

interface IUsersRepository {
  findById(id: UserId): Promise<User | RepositoryError>
  findByPhone(phone: PhoneNumber): Promise<User | RepositoryError>
  findByFilter({
    userIds,
    phoneCountryCodes,
  }: {
    userIds: UserId[]
    phoneCountryCodes: string[]
  }): AsyncGenerator<UserId> | RepositoryError
  filteredCount({
    userIds,
    phoneCountryCodes,
  }: {
    userIds: UserId[]
    phoneCountryCodes: string[]
  }): Promise<number | RepositoryError>
  update(user: UserUpdateInput): Promise<User | RepositoryError>
}
