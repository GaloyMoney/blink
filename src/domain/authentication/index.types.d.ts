type SessionId = string & { readonly brand: unique symbol }

type AuthenticationError = import("./errors").AuthenticationError

type IdentityPassword = string & { readonly brand: unique symbol }

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
  loginToken(
    phone: PhoneNumber,
  ): Promise<LoginWithPhoneNoPasswordSchemaResponse | AuthenticationError>
  loginCookie(
    phone: PhoneNumber,
  ): Promise<LoginWithPhoneCookieSchemaResponse | AuthenticationError>
  logoutToken(token: SessionToken): Promise<void | AuthenticationError>
  logoutCookie(cookie: SessionCookie): Promise<void | AuthenticationError>
  createIdentityWithSession(
    phone: PhoneNumber,
  ): Promise<CreateKratosUserForPhoneNoPasswordSchemaResponse | AuthenticationError>
  createIdentityWithCookie(
    phone: PhoneNumber,
  ): Promise<CreateKratosUserForPhoneNoPasswordSchemaCookieResponse | AuthenticationError>
  createIdentityNoSession(phone: PhoneNumber): Promise<UserId | AuthenticationError>
  upgradeToPhoneAndEmailSchema(input: {
    kratosUserId: UserId
    email: EmailAddress
  }): Promise<IdentityPhone | AuthenticationError> // TODO: should be IdentityPhoneWithPassword
  updatePhone(input: {
    kratosUserId: UserId
    phone: PhoneNumber
  }): Promise<IdentityPhone | AuthenticationError>
}

interface IIdentityRepository {
  getIdentity(id: UserId): Promise<IdentityPhone | KratosError>
  listIdentities(): Promise<IdentityPhone[] | KratosError>
  slowFindByPhone(phone: PhoneNumber): Promise<IdentityPhone | KratosError>
  deleteIdentity(id: UserId): Promise<void | KratosError>
}
