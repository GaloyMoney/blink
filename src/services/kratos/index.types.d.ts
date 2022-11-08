type KratosIdentity = import("@ory/client").Identity

// Kratos SDK is implying that identity always exist for Session
//
// TODO: verify identity is always defined for session
// a case where it could not be defined is: aal2 is mandatory for whoami
// but only aal1 has been done.
// in that case the session would be valid but identity would not be returned
type KratosSession = import("@ory/client").Session

type IdentitySchemaContainer = import("@ory/client").IdentitySchemaContainer

type KratosEmail = string & { readonly brand: unique symbol }

type ValidateKratosTokenResult = {
  kratosUserId: KratosUserId
  session: Session
}
