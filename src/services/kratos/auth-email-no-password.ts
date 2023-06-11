import { getKratosPasswords } from "@config"

import { wrapAsyncFunctionsToRunInSpan } from "@services/tracing"

import {
  EmailCodeInvalidError,
  EmailNotVerifiedError,
  LikelyUserAlreadyExistError,
} from "@domain/authentication/errors"

import { Identity, UpdateIdentityBody } from "@ory/client"

import { kratosAdmin, kratosPublic, toDomainIdentityPhone } from "./private"
import { IncompatibleSchemaUpgradeError, KratosError, UnknownKratosError } from "./errors"

// login with email

export const AuthWithEmailPasswordlessService = (): IAuthWithEmailPasswordlessService => {
  const initiateEmailVerification = async ({ email }: { email: EmailAddress }) => {
    const method = "code"
    try {
      const { data } = await kratosPublic.createNativeRecoveryFlow()
      await kratosPublic.updateRecoveryFlow({
        flow: data.id,
        updateRecoveryFlowBody: {
          email,
          method,
        },
      })

      return data.id
    } catch (err) {
      return new UnknownKratosError(err.message || err)
    }
  }

  const validateEmailVerification = async ({
    code,
    flow,
  }: {
    code: string
    flow: string
  }) => {
    const method = "code"

    try {
      const res = await kratosPublic.updateRecoveryFlow({
        flow,
        updateRecoveryFlowBody: {
          method,
          code,
        },
      })

      // https://github.com/ory/kratos/blob/b43c50cb8d46638f1b43d4f618dc3631a28cb719/text/id.go#L151
      const ErrorValidationRecoveryCodeInvalidOrAlreadyUsedId = 4060006
      if (
        res.data.ui.messages?.[0].id === ErrorValidationRecoveryCodeInvalidOrAlreadyUsedId
      ) {
        return new EmailCodeInvalidError()
      }

      return new UnknownKratosError("happy case should error :/")
    } catch (err) {
      if (err.response.status === 422) {
        // FIXME bug in kratos? https://github.com/ory/kratos/discussions/2923
        // console.log("422 response, success?")
        return true
      }

      return new UnknownKratosError(err.message || err)
    }
  }

  const isEmailVerified = async ({
    email,
  }: {
    email: EmailAddress
  }): Promise<boolean | KratosError> => {
    try {
      const identity = await kratosAdmin.listIdentities({ credentialsIdentifier: email })

      // TODO: correctly loop across all array values instead of [0]
      // TODO: throw error if no identity found?
      return identity.data[0].verifiable_addresses?.[0].verified ?? false
    } catch (err) {
      return new UnknownKratosError(err.message || err)
    }
  }

  const password = getKratosPasswords().masterUserPassword

  const login = async ({
    email,
  }: {
    email: EmailAddress
  }): Promise<LoginWithPhoneNoPasswordSchemaResponse | KratosError> => {
    const identifier = email
    const method = "password"
    try {
      const flow = await kratosPublic.createNativeLoginFlow()
      const result = await kratosPublic.updateLoginFlow({
        flow: flow.data.id,
        updateLoginFlowBody: {
          identifier,
          method,
          password,
        },
      })
      const sessionToken = result.data.session_token as SessionToken

      // note: this only works when whoami: required_aal = aal1
      const kratosUserId = result.data.session.identity.id as UserId

      return { sessionToken, kratosUserId }
    } catch (err) {
      return new UnknownKratosError(err.message || err)
    }
  }

  const addUnverifiedEmailToIdentity = async ({
    kratosUserId,
    email,
  }: {
    kratosUserId: UserId
    email: EmailAddress
  }) => {
    let identity: Identity

    try {
      ;({ data: identity } = await kratosAdmin.getIdentity({ id: kratosUserId }))
    } catch (err) {
      if (err.message === "Request failed with status code 400") {
        // FIXME: not the right error. we expect the identity to exist
        return new LikelyUserAlreadyExistError(err.message || err)
      }

      return new UnknownKratosError(err.message || err)
    }

    if (identity.schema_id !== "phone_no_password_v0") {
      return new IncompatibleSchemaUpgradeError()
    }

    if (identity.state === undefined)
      throw new KratosError("state undefined, probably impossible state") // type issue

    identity.traits = { ...identity.traits, email }

    const adminIdentity: UpdateIdentityBody = {
      ...identity,
      credentials: { password: { config: { password } } },
      state: identity.state,
      schema_id: "phone_email_no_password_v0",
    }

    try {
      const { data: newIdentity } = await kratosAdmin.updateIdentity({
        id: kratosUserId,
        updateIdentityBody: adminIdentity,
      })

      // FIXME: should be toDomainIdentityPhoneEmail
      return toDomainIdentityPhone(newIdentity)
    } catch (err) {
      return new UnknownKratosError(err.message || err)
    }
  }

  const removeEmailFromIdentity = async ({ kratosUserId }: { kratosUserId: UserId }) => {
    let identity: Identity

    try {
      ;({ data: identity } = await kratosAdmin.getIdentity({ id: kratosUserId }))
    } catch (err) {
      return new UnknownKratosError(err.message || err)
    }

    if (identity.schema_id !== "phone_email_no_password_v0") {
      return new IncompatibleSchemaUpgradeError()
    }

    if (identity.state === undefined)
      throw new KratosError("state undefined, probably impossible state") // type issue

    delete identity.traits.email

    const adminIdentity: UpdateIdentityBody = {
      ...identity,
      credentials: { password: { config: { password } } },
      state: identity.state,
      schema_id: "phone_no_password_v0",
    }

    try {
      const { data: newIdentity } = await kratosAdmin.updateIdentity({
        id: kratosUserId,
        updateIdentityBody: adminIdentity,
      })

      return toDomainIdentityPhone(newIdentity)
    } catch (err) {
      return new UnknownKratosError(err.message || err)
    }
  }

  const removePhoneFromIdentity = async ({ kratosUserId }: { kratosUserId: UserId }) => {
    let identity: Identity

    try {
      ;({ data: identity } = await kratosAdmin.getIdentity({ id: kratosUserId }))
    } catch (err) {
      return new UnknownKratosError(err.message || err)
    }

    if (identity.schema_id !== "phone_email_no_password_v0") {
      return new IncompatibleSchemaUpgradeError()
    }

    if (identity.state === undefined)
      throw new KratosError("state undefined, probably impossible state") // type issue

    if (identity.verifiable_addresses?.[0].verified !== true) {
      return new EmailNotVerifiedError()
    }

    delete identity.traits.phone

    const adminIdentity: UpdateIdentityBody = {
      ...identity,
      credentials: { password: { config: { password } } },
      state: identity.state,
      schema_id: "email_no_password_v0",
    }

    try {
      const { data: newIdentity } = await kratosAdmin.updateIdentity({
        id: kratosUserId,
        updateIdentityBody: adminIdentity,
      })

      // toDomainEmailIdentity
      return toDomainIdentityPhone(newIdentity)
    } catch (err) {
      return new UnknownKratosError(err.message || err)
    }
  }

  return wrapAsyncFunctionsToRunInSpan({
    namespace: "services.kratos.auth-email-no-password",
    fns: {
      removeEmailFromIdentity,
      removePhoneFromIdentity,
      addUnverifiedEmailToIdentity,
      initiateEmailVerification,
      validateEmailVerification,
      isEmailVerified,
      login,
    },
  })
}
