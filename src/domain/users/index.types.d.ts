type PhoneNumber = string & { readonly brand: unique symbol }
type PhoneCode = string & { readonly brand: unique symbol }

type EmailAddress = string & { readonly brand: unique symbol }

type UserLanguage = typeof import("./languages").Languages[number]

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
  language: UserLanguage
}

interface IIdentityRepository {
  getIdentity(id: KratosUserId): Promise<IdentityPhone | KratosError>
  listIdentities(): Promise<IdentityPhone[] | KratosError>
  slowFindByPhone(phone: PhoneNumber): Promise<IdentityPhone | KratosError>
  setPhoneMetadata({
    id,
    phoneMetadata,
  }: SetPhoneMetadataArgs): Promise<IdentityPhone | RepositoryError>
  setDeviceTokens({
    id,
    deviceTokens,
  }: SetDeviceTokensArgs): Promise<IdentityPhone | RepositoryError>
  setLanguage({ id, language }: SetLanguageArgs): Promise<IdentityPhone | RepositoryError>
}
