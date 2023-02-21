import { getKratosPasswords } from "@config"

import {
  LikelyNoUserWithThisPhoneExistError,
  LikelyUserAlreadyExistError,
} from "@domain/authentication/errors"
import {
  CreateIdentityBody,
  UpdateIdentityBody,
  Identity,
  SuccessfulNativeLogin,
  SuccessfulNativeRegistration,
} from "@ory/client"

import { AxiosResponse } from "node_modules/@ory/client/node_modules/axios/index"

import setCookie from "set-cookie-parser"
import libCookie from "cookie"

import {
  AuthenticationKratosError,
  IncompatibleSchemaUpgradeError,
  KratosError,
  UnknownKratosError,
} from "./errors"

import { kratosAdmin, kratosPublic, toDomainIdentityPhone } from "./private"

// login with phone

export const AuthWithPhonePasswordlessService = (): IAuthWithPhonePasswordlessService => {
  const password = getKratosPasswords().masterUserPassword

  const loginToken = async (
    phone: PhoneNumber,
  ): Promise<LoginWithPhoneNoPasswordSchemaResponse | KratosError> => {
    const flow = await kratosPublic.createNativeLoginFlow()

    const identifier = phone
    const method = "password"

    let result: AxiosResponse<SuccessfulNativeLogin>

    try {
      result = await kratosPublic.updateLoginFlow({
        flow: flow.data.id,
        updateLoginFlowBody: {
          identifier,
          method,
          password,
        },
      })
    } catch (err) {
      if (err.message === "Request failed with status code 400") {
        return new LikelyNoUserWithThisPhoneExistError(err.message || err)
      }

      if (err.message === "Request failed with status code 401") {
        return new AuthenticationKratosError(err.message || err)
      }

      return new UnknownKratosError(err.message || err)
    }

    const sessionToken = result.data.session_token as SessionToken

    // note: this only works when whoami: required_aal = aal1
    const kratosUserId = result.data.session.identity.id as UserId

    return { sessionToken, kratosUserId }
  }

  const loginCookie = async (
    phone: PhoneNumber,
  ): Promise<LoginWithPhoneCookieSchemaResponse | KratosError> => {
    const flow = await kratosPublic.createBrowserLoginFlow()
    const parsedCookies = setCookie.parse(flow.headers["set-cookie"])
    const csrfCookie = parsedCookies?.find((c) => c.name.includes("csrf"))
    if (!csrfCookie) return new KratosError("Could not find csrf cookie")
    let cookie
    try {
      cookie = libCookie.serialize(csrfCookie.name, csrfCookie.value, {
        expires: csrfCookie.expires,
        maxAge: csrfCookie.maxAge,
        sameSite: "none",
        secure: csrfCookie.secure,
        httpOnly: csrfCookie.httpOnly,
        path: csrfCookie.path,
      })
    } catch (err) {
      return new UnknownKratosError(err.message || err)
    }

    const identifier = phone
    const method = "password"
    let result: AxiosResponse
    try {
      result = await kratosPublic.updateLoginFlow({
        flow: flow.data.id,
        cookie: decodeURIComponent(cookie),
        updateLoginFlowBody: {
          identifier,
          method,
          password,
          csrf_token: csrfCookie.value,
        },
      })
    } catch (err) {
      if (err.message === "Request failed with status code 400") {
        return new LikelyNoUserWithThisPhoneExistError(err.message || err)
      }
      if (err.message === "Request failed with status code 401") {
        return new AuthenticationKratosError(err.message || err)
      }
      return new UnknownKratosError(err.message || err)
    }
    const cookiesToSendBackToClient: Array<SessionCookie> = result.headers["set-cookie"]
    // note: this only works when whoami: required_aal = aal1
    const kratosUserId = result.data.session.identity.id as UserId
    return { cookiesToSendBackToClient, kratosUserId }
  }

  const logoutToken = async (token: string): Promise<void | KratosError> => {
    try {
      await kratosPublic.performNativeLogout({
        performNativeLogoutBody: {
          session_token: token,
        },
      })
    } catch (err) {
      return new UnknownKratosError(err.message || err)
    }
  }

  const logoutCookie = async (cookie: string): Promise<void | KratosError> => {
    try {
      const session = await kratosPublic.toSession({ cookie })
      const sessionId = session.data.id
      // * revoke token via admin api
      //   there is no way to do it via cookies and the public api via the backend
      //   I tried the kratosPublic.createBrowserLogoutFlow but it did not work
      //   properly with cookies
      await kratosAdmin.disableSession({
        id: sessionId,
      })
    } catch (err) {
      return new UnknownKratosError(err.message || err)
    }
  }

  const createIdentityWithSession = async (
    phone: PhoneNumber,
  ): Promise<CreateKratosUserForPhoneNoPasswordSchemaResponse | KratosError> => {
    const flow = await kratosPublic.createNativeRegistrationFlow()

    const traits = { phone }
    const method = "password"

    let result: AxiosResponse<SuccessfulNativeRegistration>

    try {
      result = await kratosPublic.updateRegistrationFlow({
        flow: flow.data.id,
        updateRegistrationFlowBody: {
          traits,
          method,
          password,
        },
      })
    } catch (err) {
      if (err.message === "Request failed with status code 400") {
        return new LikelyUserAlreadyExistError(err.message || err)
      }

      return new UnknownKratosError(err.message || err)
    }

    const sessionToken = result.data.session_token as SessionToken
    const kratosUserId = result.data.identity.id as UserId

    return { sessionToken, kratosUserId }
  }

  const createIdentityWithCookie = async (
    phone: PhoneNumber,
  ): Promise<CreateKratosUserForPhoneNoPasswordSchemaCookieResponse | KratosError> => {
    const flow = await kratosPublic.createBrowserRegistrationFlow()
    const headers = flow.headers["set-cookie"]
    const parsedCookies = setCookie.parse(headers)
    const csrfCookie = parsedCookies?.find((c) => c.name.includes("csrf"))
    if (!csrfCookie) return new KratosError("Could not find csrf cookie")
    let cookie
    try {
      cookie = libCookie.serialize(csrfCookie.name, csrfCookie.value, {
        expires: csrfCookie.expires,
        maxAge: csrfCookie.maxAge,
        sameSite: "none",
        secure: csrfCookie.secure,
        httpOnly: csrfCookie.httpOnly,
        path: csrfCookie.path,
      })
    } catch (err) {
      return new UnknownKratosError(err.message || err)
    }

    const traits = { phone }
    const method = "password"
    let result: AxiosResponse

    try {
      result = await kratosPublic.updateRegistrationFlow({
        flow: flow.data.id,
        cookie: decodeURIComponent(cookie),
        updateRegistrationFlowBody: {
          traits,
          method,
          password,
          csrf_token: csrfCookie.value,
        },
      })
    } catch (err) {
      if (err.message === "Request failed with status code 400") {
        return new LikelyUserAlreadyExistError(err.message || err)
      }
      return new UnknownKratosError(err.message || err)
    }
    const cookiesToSendBackToClient: Array<SessionCookie> = result.headers["set-cookie"]
    const kratosUserId = result.data.identity.id as UserId
    return { cookiesToSendBackToClient, kratosUserId }
  }

  const createIdentityNoSession = async (
    phone: PhoneNumber,
  ): Promise<UserId | KratosError> => {
    const adminIdentity: CreateIdentityBody = {
      credentials: { password: { config: { password } } },
      state: "active",
      schema_id: "phone_no_password_v0",
      traits: { phone },
    }

    let kratosUserId: UserId

    try {
      const { data: identity } = await kratosAdmin.createIdentity({
        createIdentityBody: adminIdentity,
      })

      kratosUserId = identity.id as UserId
    } catch (err) {
      if (err.message === "Request failed with status code 400") {
        return new LikelyUserAlreadyExistError(err.message || err)
      }

      return new UnknownKratosError(err.message || err)
    }

    return kratosUserId
  }

  const updatePhone = async ({
    kratosUserId,
    phone,
  }: {
    kratosUserId: UserId
    phone: PhoneNumber
  }) => {
    let identity: Identity

    try {
      ;({ data: identity } = await kratosAdmin.getIdentity({ id: kratosUserId }))
    } catch (err) {
      return new UnknownKratosError(err.message || err)
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
      return new UnknownKratosError(err.message || err)
    }
  }

  const upgradeToPhoneAndEmailSchema = async ({
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
        return new LikelyUserAlreadyExistError(err.message || err)
      }

      return new UnknownKratosError(err.message || err)
    }

    if (
      identity.schema_id !== "phone_no_password_v0" &&
      identity.schema_id !== "phone_or_email_password_v0"
    ) {
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

      return toDomainIdentityPhone(newIdentity)
    } catch (err) {
      return new UnknownKratosError(err.message || err)
    }
  }

  return {
    loginToken,
    loginCookie,
    logoutToken,
    logoutCookie,
    createIdentityWithSession,
    createIdentityWithCookie,
    createIdentityNoSession,
    upgradeToPhoneAndEmailSchema,
    updatePhone,
  }
}
