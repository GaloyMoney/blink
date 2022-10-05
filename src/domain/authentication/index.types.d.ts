type KratosAuthResponse = {
  sessionToken: KratosSessionToken
  kratosUserId: KratosUserId
}

type LoginWithPhoneNoPasswordSchemaResponse = KratosAuthResponse

type CreateKratosUserForPhoneNoPasswordSchemaResponse = KratosAuthResponse

type KratosUserId = string & { readonly brand: unique symbol }
type KratosSessionToken = string & { readonly brand: unique symbol }

type KratosError = import("./errors").KratosError

type IdentityKratos = import("@ory/client").Identity
type Identity = Omit<IdentityKratos, "id"> & { id: KratosUserId }

type SessionId = string & { readonly brand: unique symbol }

// ratos SDK is implying that identity always exist for Session
//
// TODO: verify identity is always defined for session
// a case where it could not be defined is: aal2 is mandatory for whoami
// but only aal1 has been done.
// in that case the session would be valid but identity would not be returned
type SessionKratos = import("@ory/client").Session
type Session = Omit<SessionKratos, "identity" | "id"> & {
  identity: Identity
  id: SessionId
}

type IdentitySchemaContainer = import("@ory/client").IdentitySchemaContainer
type SchemaId = IdentitySchemaContainer["id"] & { readonly brand: unique symbol }

type KratosPassword = string & { readonly brand: unique symbol }
type KratosEmail = string & { readonly brand: unique symbol }

type ValidateKratosTokenResult = {
  kratosUserId: KratosUserId
  session: Session
}

interface AuthWithPhoneNoPasswordSchema {
  login(phone: PhoneNumber): Promise<LoginWithPhoneNoPasswordSchemaResponse | KratosError>
  createWithSession(
    phone: PhoneNumber,
  ): Promise<CreateKratosUserForPhoneNoPasswordSchemaResponse | KratosError>
  createNoSession(phone: PhoneNumber): Promise<KratosUserId | KratosError>
  upgradeToPhoneWithPasswordSchema(input: {
    kratosUserId: KratosUserId
    password: KratosPassword
  }): Promise<Identity | KratosError>
}
