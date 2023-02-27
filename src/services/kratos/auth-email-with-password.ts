import {
  LikelyNoUserWithThisEmailExistError,
  LikelyUserAlreadyExistError,
} from "@domain/authentication/errors"
import { SuccessfulNativeLogin, SuccessfulNativeRegistration } from "@ory/client"

import { AxiosResponse } from "node_modules/@ory/client/node_modules/axios/index"

import setCookie from "set-cookie-parser"
import libCookie from "cookie"

import { AuthenticationKratosError, KratosError, UnknownKratosError } from "./errors"

import { kratosAdmin, kratosPublic } from "./private"

export const AuthWithEmailAndPasswordService = (): IAuthWithEmailAndPasswordService => {
  const loginToken = async (
    email: EmailAddress,
    password: IdentityPassword,
  ): Promise<LoginWithEmailAndPasswordSchemaResponse | KratosError> => {
    const flow = await kratosPublic.createNativeLoginFlow()

    const identifier = email
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
        return new LikelyNoUserWithThisEmailExistError(err)
      }

      if (err.message === "Request failed with status code 401") {
        return new AuthenticationKratosError(err)
      }

      return new UnknownKratosError(err.message || err)
    }

    const sessionToken = result.data.session_token as SessionToken

    // note: this only works when whoami: required_aal = aal1
    const kratosUserId = result.data.session.identity.id as UserId

    return { sessionToken, kratosUserId }
  }

  const loginCookie = async (
    email: EmailAddress,
    password: IdentityPassword,
  ): Promise<LoginWithCookieEmailAndPasswordSchemaResponse | KratosError> => {
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

    const identifier = email
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
        return new LikelyNoUserWithThisEmailExistError(err)
      }
      if (err.message === "Request failed with status code 401") {
        return new AuthenticationKratosError(err)
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
      await kratosAdmin.disableSession({
        id: sessionId,
      })
    } catch (err) {
      return new UnknownKratosError(err.message || err)
    }
  }

  const createIdentityWithSession = async (
    email: EmailAddress,
    password: IdentityPassword,
  ): Promise<CreateKratosUserForEmailAndPasswordSchemaResponse | KratosError> => {
    const flow = await kratosPublic.createNativeRegistrationFlow()

    const traits = { email }
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
        return new LikelyUserAlreadyExistError(err)
      }

      return new UnknownKratosError(err.message || err)
    }

    const sessionToken = result.data.session_token as SessionToken
    const kratosUserId = result.data.identity.id as UserId

    return { sessionToken, kratosUserId }
  }

  const createIdentityWithCookie = async (
    email: EmailAddress,
    password: IdentityPassword,
  ): Promise<CreateKratosUserForEmailAndPasswordSchemaCookieResponse | KratosError> => {
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

    const traits = { email }
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
        return new LikelyUserAlreadyExistError(err)
      }

      return new UnknownKratosError(err.message || err)
    }
    const cookiesToSendBackToClient: Array<SessionCookie> = result.headers["set-cookie"]
    const kratosUserId = result.data.identity.id as UserId
    return { cookiesToSendBackToClient, kratosUserId }
  }

  return {
    loginToken,
    loginCookie,
    logoutToken,
    logoutCookie,
    createIdentityWithSession,
    createIdentityWithCookie,
  }
}
