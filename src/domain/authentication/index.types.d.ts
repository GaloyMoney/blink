type SessionId = string & { readonly brand: unique symbol }

type AuthenticationError = import("./errors").AuthenticationError

type IdentityPassword = string & { readonly brand: unique symbol }

// can be either kratosUserId or deviceId subjects
type UserId = string & { readonly brand: unique symbol }
type SessionToken = string & { readonly brand: unique symbol }
type SessionCookie = string & { readonly brand: unique symbol }

type IdentityPhone = {
  id: UserId
  phone: PhoneNumber
  createdAt: Date
}

type Session = {
  identity: IdentityPhone // | IdentityEmail // TODO
  id: SessionId
}

type WithSessionResponse = {
  sessionToken: SessionToken
  kratosUserId: UserId
}

type WithCookieResponse = {
  cookiesToSendBackToClient: Array<SessionCookie>
  kratosUserId: UserId
}

type LoginWithPhoneNoPasswordSchemaResponse = WithSessionResponse
type LoginWithPhoneCookieSchemaResponse = WithCookieResponse
type CreateKratosUserForPhoneNoPasswordSchemaResponse = WithSessionResponse
type CreateKratosUserForPhoneNoPasswordSchemaCookieResponse = WithCookieResponse

interface IAuthWithPhonePasswordlessService {
  loginToken(args: {
    phone: PhoneNumber
  }): Promise<LoginWithPhoneNoPasswordSchemaResponse | AuthenticationError>
  loginCookie(args: {
    phone: PhoneNumber
  }): Promise<LoginWithPhoneCookieSchemaResponse | AuthenticationError>
  logoutToken(args: { token: SessionToken }): Promise<void | AuthenticationError>
  logoutCookie(args: { cookie: SessionCookie }): Promise<void | AuthenticationError>
  createIdentityWithSession(args: {
    phone: PhoneNumber
  }): Promise<CreateKratosUserForPhoneNoPasswordSchemaResponse | AuthenticationError>
  createIdentityWithDeviceId(args: {
    phone: PhoneNumber
    deviceId: UserId
  }): Promise<CreateKratosUserForPhoneNoPasswordSchemaResponse | AuthenticationError>
  createIdentityWithCookie(args: {
    phone: PhoneNumber
  }): Promise<
    CreateKratosUserForPhoneNoPasswordSchemaCookieResponse | AuthenticationError
  >
  createIdentityNoSession(args: {
    phone: PhoneNumber
  }): Promise<UserId | AuthenticationError>
  upgradeToPhoneAndEmailSchema(input: {
    kratosUserId: UserId
    email: EmailAddress
  }): Promise<IdentityPhone | AuthenticationError> // TODO: should be IdentityPhoneWithPassword
  updatePhone(input: {
    kratosUserId: UserId
    phone: PhoneNumber
  }): Promise<IdentityPhone | AuthenticationError>
}

interface IAuthWithEmailPasswordlessService {
  initiateEmailVerification(args: { email: EmailAddress }): Promise<string | KratosError>
  validateEmailVerification(args: {
    code: string
    flow: string
  }): Promise<true | KratosError>
  login(args: {
    email: EmailAddress
  }): Promise<LoginWithPhoneNoPasswordSchemaResponse | KratosError>
}

interface IAuthWithDeviceAccountService {
  upgradeToPhoneSchema(args: {
    phone: PhoneNumber
    deviceId: UserId
  }): Promise<SessionToken | KratosError>
}

interface IIdentityRepository {
  getIdentity(id: UserId): Promise<IdentityPhone | KratosError>
  listIdentities(): Promise<IdentityPhone[] | KratosError>
  slowFindByPhone(phone: PhoneNumber): Promise<IdentityPhone | KratosError>
  deleteIdentity(id: UserId): Promise<void | KratosError>
}

// CCA2 country code such as "US" or "FR"
type CountryCode = string & { readonly brand: unique symbol }

type Country = {
  id: CountryCode
  supportedAuthChannels: ChannelType[]
}
