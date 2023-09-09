import { CreateIdentityBody, UpdateIdentityBody } from "@ory/client"
import libCookie from "cookie"
import setCookie from "set-cookie-parser"

import { KRATOS_MASTER_USER_PASSWORD } from "@config"

import {
  LikelyNoUserWithThisPhoneExistError,
  LikelyUserAlreadyExistError,
} from "@domain/authentication/errors"

import { wrapAsyncFunctionsToRunInSpan } from "@services/tracing"

import {
  AuthenticationKratosError,
  IncompatibleSchemaUpgradeError,
  KratosError,
  UnknownKratosError,
} from "./errors"
import { kratosAdmin, kratosPublic, toDomainIdentityPhone } from "./private"
import { SchemaIdType } from "./schema"

// login with phone

export const AuthWithPhonePasswordlessService = (): IAuthWithPhonePasswordlessService => {
  const password = KRATOS_MASTER_USER_PASSWORD

  const loginToken = async ({
    phone,
  }: {
    phone: PhoneNumber
  }): Promise<LoginWithPhoneNoPasswordSchemaResponse | KratosError> => {
    const identifier = phone
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
      if (err instanceof Error && err.message === "Request failed with status code 400") {
        return new LikelyNoUserWithThisPhoneExistError(err.message || err)
      }

      if (err instanceof Error && err.message === "Request failed with status code 401") {
        return new AuthenticationKratosError(err.message || err)
      }

      return new UnknownKratosError(err)
    }
  }

  const loginCookie = async ({
    phone,
  }: {
    phone: PhoneNumber
  }): Promise<LoginWithPhoneCookieSchemaResponse | KratosError> => {
    const identifier = phone
    const method = "password"
    try {
      const flow = await kratosPublic.createBrowserLoginFlow()
      const parsedCookies = setCookie.parse(flow.headers["set-cookie"])
      const csrfCookie = parsedCookies?.find((c) => c.name.includes("csrf"))
      if (!csrfCookie) return new KratosError("Could not find csrf cookie")

      const cookie = libCookie.serialize(csrfCookie.name, csrfCookie.value, {
        expires: csrfCookie.expires,
        maxAge: csrfCookie.maxAge,
        sameSite: "none",
        secure: csrfCookie.secure,
        httpOnly: csrfCookie.httpOnly,
        path: csrfCookie.path,
      })
      const result = await kratosPublic.updateLoginFlow({
        flow: flow.data.id,
        cookie: decodeURIComponent(cookie),
        updateLoginFlowBody: {
          identifier,
          method,
          password,
          csrf_token: csrfCookie.value,
        },
      })
      const cookiesToSendBackToClient: Array<SessionCookie> = result.headers["set-cookie"]
      // note: this only works when whoami: required_aal = aal1
      const kratosUserId = result.data.session.identity.id as UserId
      return { cookiesToSendBackToClient, kratosUserId }
    } catch (err) {
      if (err instanceof Error && err.message === "Request failed with status code 400") {
        return new LikelyNoUserWithThisPhoneExistError(err.message || err)
      }
      if (err instanceof Error && err.message === "Request failed with status code 401") {
        return new AuthenticationKratosError(err.message || err)
      }
      return new UnknownKratosError(err)
    }
  }

  const logoutToken = async ({
    token,
  }: {
    token: AuthToken
  }): Promise<void | KratosError> => {
    try {
      await kratosPublic.performNativeLogout({
        performNativeLogoutBody: {
          session_token: token,
        },
      })
    } catch (err) {
      return new UnknownKratosError(err)
    }
  }

  const logoutCookie = async ({
    cookie,
  }: {
    cookie: SessionCookie
  }): Promise<void | KratosError> => {
    try {
      const flow = await kratosPublic.createBrowserLogoutFlow({
        cookie,
      })
      const logoutToken = flow.data.logout_token
      await kratosPublic.updateLogoutFlow({
        token: logoutToken,
        cookie,
      })
    } catch (err) {
      return new UnknownKratosError(err)
    }
  }

  const createIdentityWithSession = async ({
    phone,
    phoneMetadata,
  }: {
    phone: PhoneNumber
    phoneMetadata?: PhoneMetadata
  }): Promise<CreateKratosUserForPhoneNoPasswordSchemaResponse | KratosError> => {
    const traits = { phone }
    const method = "password"
    try {
      const flow = await kratosPublic.createNativeRegistrationFlow()
      const result = await kratosPublic.updateRegistrationFlow({
        flow: flow.data.id,
        updateRegistrationFlowBody: {
          traits,
          method,
          password,
          transient_payload: { phoneMetadata },
        },
      })
      const authToken = result.data.session_token as AuthToken
      const kratosUserId = result.data.identity.id as UserId

      return { authToken, kratosUserId }
    } catch (err) {
      if (err instanceof Error && err.message === "Request failed with status code 400") {
        return new LikelyUserAlreadyExistError(err.message || err)
      }

      return new UnknownKratosError(err)
    }
  }

  const updateIdentityFromDeviceAccount = async ({
    phone,
    userId,
  }: {
    phone: PhoneNumber
    userId: UserId
  }): Promise<IdentityPhone | KratosError> => {
    let identity: KratosIdentity

    try {
      ;({ data: identity } = await kratosAdmin.getIdentity({ id: userId }))
    } catch (err) {
      return new UnknownKratosError(err)
    }

    if (identity.schema_id !== "username_password_deviceid_v0") {
      return new IncompatibleSchemaUpgradeError()
    }

    if (identity.state === undefined)
      throw new UnknownKratosError("state undefined, probably impossible state") // type issue

    identity.traits = { phone }

    const adminIdentity: UpdateIdentityBody = {
      ...identity,
      credentials: { password: { config: { password } } },
      state: identity.state,
      schema_id: SchemaIdType.PhoneNoPasswordV0,
    }

    try {
      const { data: newIdentity } = await kratosAdmin.updateIdentity({
        id: userId,
        updateIdentityBody: adminIdentity,
      })

      return toDomainIdentityPhone(newIdentity)
    } catch (err) {
      return new UnknownKratosError(err)
    }
  }

  const createIdentityWithCookie = async ({
    phone,
  }: {
    phone: PhoneNumber
  }): Promise<CreateKratosUserForPhoneNoPasswordSchemaCookieResponse | KratosError> => {
    const traits = { phone }
    const method = "password"

    try {
      const flow = await kratosPublic.createBrowserRegistrationFlow()
      const headers = flow.headers["set-cookie"]
      const parsedCookies = setCookie.parse(headers)
      const csrfCookie = parsedCookies?.find((c) => c.name.includes("csrf"))
      if (!csrfCookie) return new KratosError("Could not find csrf cookie")
      const cookie = libCookie.serialize(csrfCookie.name, csrfCookie.value, {
        expires: csrfCookie.expires,
        maxAge: csrfCookie.maxAge,
        sameSite: "none",
        secure: csrfCookie.secure,
        httpOnly: csrfCookie.httpOnly,
        path: csrfCookie.path,
      })
      const result = await kratosPublic.updateRegistrationFlow({
        flow: flow.data.id,
        cookie: decodeURIComponent(cookie),
        updateRegistrationFlowBody: {
          traits,
          method,
          password,
          csrf_token: csrfCookie.value,
        },
      })
      const cookiesToSendBackToClient: Array<SessionCookie> = result.headers["set-cookie"]
      const kratosUserId = result.data.identity.id as UserId
      return { cookiesToSendBackToClient, kratosUserId }
    } catch (err) {
      if (err instanceof Error && err.message === "Request failed with status code 400") {
        return new LikelyUserAlreadyExistError(err.message || err)
      }
      return new UnknownKratosError(err)
    }
  }

  const createIdentityNoSession = async ({
    phone,
  }: {
    phone: PhoneNumber
  }): Promise<UserId | KratosError> => {
    const adminIdentity: CreateIdentityBody = {
      credentials: { password: { config: { password } } },
      state: "active",
      schema_id: SchemaIdType.PhoneNoPasswordV0,
      traits: { phone },
    }

    try {
      const { data: identity } = await kratosAdmin.createIdentity({
        createIdentityBody: adminIdentity,
      })

      return identity.id as UserId
    } catch (err) {
      if (err instanceof Error && err.message === "Request failed with status code 400") {
        return new LikelyUserAlreadyExistError(err.message || err)
      }
      return new UnknownKratosError(err)
    }
  }

  const updatePhone = async ({
    kratosUserId,
    phone,
  }: {
    kratosUserId: UserId
    phone: PhoneNumber
  }) => {
    let identity: KratosIdentity

    try {
      ;({ data: identity } = await kratosAdmin.getIdentity({ id: kratosUserId }))
    } catch (err) {
      return new UnknownKratosError(err)
    }

    if (identity.state === undefined) {
      return new KratosError("state undefined, probably impossible state") // type issue
    }

    identity.traits = { phone }

    const adminIdentity: UpdateIdentityBody = {
      ...identity,
      credentials: { password: { config: { password } } },
      state: identity.state,
    }

    try {
      const { data: newIdentity } = await kratosAdmin.updateIdentity({
        id: kratosUserId,
        updateIdentityBody: adminIdentity,
      })
      return toDomainIdentityPhone(newIdentity)
    } catch (err) {
      return new UnknownKratosError(err)
    }
  }

  return wrapAsyncFunctionsToRunInSpan({
    namespace: "services.kratos.auth-phone-no-password",
    fns: {
      loginToken,
      loginCookie,
      logoutToken,
      logoutCookie,
      createIdentityWithSession,
      updateIdentityFromDeviceAccount,
      createIdentityWithCookie,
      createIdentityNoSession,
      updatePhone,
    },
  })
}
