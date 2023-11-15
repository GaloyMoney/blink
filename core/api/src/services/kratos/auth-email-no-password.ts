import { isAxiosError } from "axios"

import { UpdateIdentityBody } from "@ory/client"

import knex from "knex"

import {
  CodeExpiredKratosError,
  EmailAlreadyExistsError,
  IncompatibleSchemaUpgradeError,
  InvalidIdentitySessionKratosError,
  KratosError,
  UnknownKratosError,
} from "./errors"
import { kratosAdmin, kratosPublic, toDomainIdentityEmailPhone } from "./private"
import { SchemaIdType } from "./schema"

import { checkedToEmailAddress } from "@/domain/users"
import { wrapAsyncFunctionsToRunInSpan } from "@/services/tracing"
import {
  EmailCodeExpiredError,
  EmailCodeInvalidError,
  EmailUnverifiedError,
  EmailValidationSubmittedTooOftenError,
  LikelyUserAlreadyExistError,
} from "@/domain/authentication/errors"
import { KRATOS_MASTER_USER_PASSWORD, KRATOS_PG_CON } from "@/config"

const getKratosKnex = () =>
  knex({
    client: "pg",
    connection: KRATOS_PG_CON,
  })

const getIdentityIdFromFlowId = async (flowId: string) => {
  const knex = getKratosKnex()

  const table = "selfservice_recovery_flows"

  const res = await knex
    .select(["id", "recovered_identity_id"])
    .from(table)
    .where({ id: flowId })

  await knex.destroy()

  if (res.length === 0) {
    return new UnknownKratosError(`no identity for flow ${flowId}`)
  }

  return res[0].recovered_identity_id as UserId
}

// login with email

export const AuthWithEmailPasswordlessService = (): IAuthWithEmailPasswordlessService => {
  const password = KRATOS_MASTER_USER_PASSWORD

  // sendEmailWithCode return a flowId even if the user doesn't exist
  // this is to avoid account enumeration attacks
  const sendEmailWithCode = async ({ email }: { email: EmailAddress }) => {
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

      return data.id as EmailFlowId
    } catch (err) {
      return new UnknownKratosError(err)
    }
  }

  const validateCode = async ({
    code,
    emailFlowId: flow,
  }: {
    code: EmailCode
    emailFlowId: EmailFlowId
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

      // https://github.com/ory/kratos/blob/master/text/id.go#L145
      const ValidationRecoveryCodeInvalidOrAlreadyUsedIdError = 4060006
      const ValidationRecoveryCodeExpiredError = 4060005
      const ValidationRecoveryCodeRateLimitError = 4000001

      const errorCode = res.data.ui.messages?.[0].id
      switch (errorCode) {
        case ValidationRecoveryCodeInvalidOrAlreadyUsedIdError:
          return new EmailCodeInvalidError()
        case ValidationRecoveryCodeExpiredError:
          return new EmailCodeExpiredError()
        case ValidationRecoveryCodeRateLimitError:
          return new EmailValidationSubmittedTooOftenError()
        default:
          return new UnknownKratosError(
            `should be a dead branch as 422 error code expected (${errorCode})`,
          )
      }
    } catch (err) {
      // the recovery flow assume that the user has an additional action
      // after the code has been verified to reset the password.
      //
      // we do not need to do that because we are passwordless

      if (
        isAxiosError(err) &&
        err.response?.data?.error?.id === "browser_location_change_required"
      ) {
        const cookies: string[] | undefined = err.response?.headers["set-cookie"]
        if (cookies === undefined) return new UnknownKratosError("cookies undefined")

        const sessionCookie = cookies.find((cookie) =>
          cookie.startsWith("ory_kratos_session"),
        )

        let email: EmailAddress
        let kratosUserId: UserId
        let totpRequired = false

        try {
          const session = await kratosPublic.toSession({ cookie: sessionCookie })
          if (!session.data.identity) return new InvalidIdentitySessionKratosError()

          const emailRaw = checkedToEmailAddress(
            session.data.identity.recovery_addresses?.[0].value ?? "",
          )
          if (emailRaw instanceof Error) return new UnknownKratosError("email invalid")
          email = emailRaw

          kratosUserId = session.data.identity.id as UserId
        } catch (err) {
          if (
            isAxiosError(err) &&
            err?.response?.data.error.id === "session_aal2_required"
          ) {
            // TOTP currently doesn't work with the recovery flow with the API based flow
            //
            // different strategies has been tried:
            //
            // hack around the fact we get a sessionCookie but really we're looking to
            // get the authToken. we don't have access to the email in this branch,
            // which prevent us to login with our own logic.
            //
            // we could have some internal data structure to get it from the initial request
            // but adding more state is not ideal.
            //
            // to not keep more state around, we are using knex to fetch it from kratos internal database
            //
            // alternatively, we could set whoami: required_aal: aal1 instead of highest_available
            // and try to figure out from the backend if the associated has totp enabled or not
            // but that would required more logic around the whoami: which would be also hacky and
            // would involve additional code for every request, not just auth authenticated one
            //
            // TODO:
            // remove the workaround below when this has been implemented
            // https://github.com/ory/kratos/issues/3163
            //

            const userIdRaw = await getIdentityIdFromFlowId(flow)
            if (userIdRaw instanceof Error) return userIdRaw

            kratosUserId = userIdRaw

            const identity = await kratosAdmin.getIdentity({ id: kratosUserId })
            if (identity instanceof Error) return identity

            email = identity.data.recovery_addresses?.[0].value as EmailAddress
            totpRequired = true
          } else {
            return new UnknownKratosError(err)
          }
        }

        return { email, kratosUserId, totpRequired }
      }
      // kratos return a 403 - Forbidden error when the code has expired
      if (isAxiosError(err) && err.response?.status === 403) {
        return new CodeExpiredKratosError()
      }
      return new UnknownKratosError(err)
    }
  }

  const isEmailVerified = async ({
    email,
  }: {
    email: EmailAddress
  }): Promise<boolean | KratosError> => {
    try {
      const identity = await kratosAdmin.listIdentities({ credentialsIdentifier: email })

      // we are assuming that email are unique, therefore only one entry can be returned
      return identity.data[0]?.verifiable_addresses?.[0].verified ?? false
    } catch (err) {
      return new UnknownKratosError(err)
    }
  }

  const loginToken = async ({
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
      const authToken = result.data.session_token as AuthToken

      // identity is only defined when identity has not enabled totp
      const kratosUserId = result.data.session.identity?.id as UserId | undefined

      return { authToken, kratosUserId }
    } catch (err) {
      return new UnknownKratosError(err)
    }
  }

  const addUnverifiedEmailToIdentity = async ({
    kratosUserId,
    email,
  }: {
    kratosUserId: UserId
    email: EmailAddress
  }) => {
    // TODO: replace with ?
    // const identity = await IdentityRepository().getIdentity(kratosUserId)
    // if (identity instanceof Error) return identity
    // if (identity.schema !== SchemaIdType.PhoneNoPasswordV0) {

    let identity: KratosIdentity

    try {
      ;({ data: identity } = await kratosAdmin.getIdentity({ id: kratosUserId }))
    } catch (err) {
      if (!isAxiosError(err)) {
        return new UnknownKratosError(err)
      }

      if (err.message === "Request failed with status code 400") {
        // FIXME: not the right error. we expect the identity to exist
        return new LikelyUserAlreadyExistError(err.message || err)
      }

      return new UnknownKratosError(err.message || err)
    }

    if (identity.schema_id !== SchemaIdType.PhoneNoPasswordV0) {
      return new IncompatibleSchemaUpgradeError(
        `current schema_id: ${identity.schema_id}, expected: ${SchemaIdType.PhoneNoPasswordV0}`,
      )
    }

    if (identity.state === undefined)
      throw new UnknownKratosError("state undefined, probably impossible state") // type issue

    identity.traits = { ...identity.traits, email }

    const adminIdentity: UpdateIdentityBody = {
      ...identity,
      credentials: { password: { config: { password } } },
      state: identity.state,
      schema_id: SchemaIdType.PhoneEmailNoPasswordV0,
    }

    try {
      const { data: newIdentity } = await kratosAdmin.updateIdentity({
        id: kratosUserId,
        updateIdentityBody: adminIdentity,
      })

      return toDomainIdentityEmailPhone(newIdentity)
    } catch (err) {
      if (isAxiosError(err)) {
        if (err.message === "Request failed with status code 409") {
          // FIXME account enumeration attack
          // instead, should be sending an email to the user to inform him
          // that there is already an account attached to his account
          return new EmailAlreadyExistsError()
        }
      }

      return new UnknownKratosError(err)
    }
  }

  const removeEmailFromIdentity = async ({ kratosUserId }: { kratosUserId: UserId }) => {
    let identity: KratosIdentity

    try {
      ;({ data: identity } = await kratosAdmin.getIdentity({ id: kratosUserId }))
    } catch (err) {
      return new UnknownKratosError(err)
    }

    if (identity.schema_id !== SchemaIdType.PhoneEmailNoPasswordV0) {
      return new IncompatibleSchemaUpgradeError(
        `current schema_id: ${identity.schema_id}, expected: ${SchemaIdType.PhoneEmailNoPasswordV0}`,
      )
    }

    if (identity.state === undefined)
      throw new UnknownKratosError("state undefined, probably impossible state") // type issue

    const email = identity.traits.email
    delete identity.traits.email

    const adminIdentity: UpdateIdentityBody = {
      ...identity,
      credentials: { password: { config: { password } } },
      state: identity.state,
      schema_id: SchemaIdType.PhoneNoPasswordV0,
    }

    try {
      await kratosAdmin.updateIdentity({
        id: kratosUserId,
        updateIdentityBody: adminIdentity,
      })

      return email
    } catch (err) {
      return new UnknownKratosError(err)
    }
  }

  const removePhoneFromIdentity = async ({ kratosUserId }: { kratosUserId: UserId }) => {
    let identity: KratosIdentity

    try {
      ;({ data: identity } = await kratosAdmin.getIdentity({ id: kratosUserId }))
    } catch (err) {
      return new UnknownKratosError(err)
    }

    if (identity.schema_id !== "phone_email_no_password_v0") {
      return new IncompatibleSchemaUpgradeError(
        `current schema_id: ${identity.schema_id}, expected: ${SchemaIdType.PhoneEmailNoPasswordV0}`,
      )
    }

    if (identity.state === undefined)
      throw new UnknownKratosError("state undefined, probably impossible state") // type issue

    if (identity.verifiable_addresses?.[0].verified !== true) {
      return new EmailUnverifiedError()
    }

    const phone = identity.traits.phone as PhoneNumber
    delete identity.traits.phone

    const adminIdentity: UpdateIdentityBody = {
      ...identity,
      credentials: { password: { config: { password } } },
      state: identity.state,
      schema_id: SchemaIdType.EmailNoPasswordV0,
    }

    try {
      await kratosAdmin.updateIdentity({
        id: kratosUserId,
        updateIdentityBody: adminIdentity,
      })

      return phone
    } catch (err) {
      return new UnknownKratosError(err)
    }
  }

  const addPhoneToIdentity = async ({
    userId,
    phone,
  }: {
    userId: UserId
    phone: PhoneNumber
  }) => {
    let identity: KratosIdentity

    try {
      ;({ data: identity } = await kratosAdmin.getIdentity({ id: userId }))
    } catch (err) {
      return new UnknownKratosError(err)
    }

    if (identity.schema_id !== SchemaIdType.EmailNoPasswordV0) {
      return new IncompatibleSchemaUpgradeError(
        `current schema_id: ${identity.schema_id}, expected: ${SchemaIdType.EmailNoPasswordV0}`,
      )
    }

    if (identity.state === undefined)
      throw new UnknownKratosError("state undefined, probably impossible state") // type issue

    identity.traits.phone = phone

    const adminIdentity: UpdateIdentityBody = {
      ...identity,
      credentials: { password: { config: { password } } },
      state: identity.state,
      schema_id: SchemaIdType.PhoneEmailNoPasswordV0,
    }

    try {
      const { data: newIdentity } = await kratosAdmin.updateIdentity({
        id: userId,
        updateIdentityBody: adminIdentity,
      })

      return toDomainIdentityEmailPhone(newIdentity)
    } catch (err) {
      return new UnknownKratosError(err)
    }
  }

  const hasEmail = async ({ kratosUserId }: { kratosUserId: UserId }) => {
    let identity: KratosIdentity

    try {
      ;({ data: identity } = await kratosAdmin.getIdentity({ id: kratosUserId }))
    } catch (err) {
      return new UnknownKratosError(err)
    }

    return !!identity.traits.email
  }

  return wrapAsyncFunctionsToRunInSpan({
    namespace: "services.kratos.auth-email-no-password",
    fns: {
      removeEmailFromIdentity,
      removePhoneFromIdentity,
      addPhoneToIdentity,
      addUnverifiedEmailToIdentity,
      sendEmailWithCode,
      validateCode,
      hasEmail,
      isEmailVerified,
      loginToken,
    },
  })
}
