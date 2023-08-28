import cors from "cors"
import express, { NextFunction, Request, Response } from "express"

import { Authentication } from "@app"
import basicAuth from "basic-auth"

import { mapError } from "@graphql/error-map"
import {
  addAttributesToCurrentSpan,
  recordExceptionInCurrentSpan,
  tracer,
} from "@services/tracing"

import {
  elevatingSessionWithTotp,
  loginWithEmailCookie,
  loginWithEmailToken,
  logoutCookie,
  requestEmailCode,
} from "@app/authentication"
import { parseIps } from "@domain/accounts-ips"
import { checkedToEmailAddress, checkedToPhoneNumber } from "@domain/users"
import bodyParser from "body-parser"

import cookieParser from "cookie-parser"

import {
  checkedToAuthToken,
  checkedToEmailLoginId,
  checkedToTotpCode,
  validateKratosCookie,
} from "@services/kratos"

import { KratosCookie, parseKratosCookies } from "@services/kratos/cookie"

import { UNSECURE_IP_FROM_REQUEST_OBJECT } from "@config"

import { parseErrorMessageFromUnknown } from "@domain/shared"

import { checkedToEmailCode, validOneTimeAuthCodeValue } from "@domain/authentication"

import {
  EmailCodeInvalidError,
  EmailValidationSubmittedTooOftenError,
} from "@domain/authentication/errors"

import { UserLoginIpRateLimiterExceededError } from "@domain/rate-limit/errors"

import { registerCaptchaGeetest } from "@app/captcha"

const authRouter = express.Router({ caseSensitive: true })

// FIXME: those directive should only apply if you select a cookie-related route

authRouter.use(cors({ origin: true, credentials: true }))
authRouter.use(bodyParser.urlencoded({ extended: true }))
authRouter.use(bodyParser.json())
authRouter.use(cookieParser())

authRouter.use((req: Request, res: Response, next: NextFunction) => {
  const ipString = UNSECURE_IP_FROM_REQUEST_OBJECT ? req?.ip : req?.headers["x-real-ip"]
  const ip = parseIps(ipString)
  if (!ip) {
    recordExceptionInCurrentSpan({ error: "IP is not defined" })
    return res.status(500).send({ error: "IP is not defined" })
  }
  req["originalIp"] = ip as IpAddress

  next()
})

authRouter.use((req: Request, res: Response, next: NextFunction) => {
  const routeName = req?.url || "unknownRoute" // Extract route from request, fallback to 'unknownRoute'
  const spanName = `servers.authRouter.${routeName}`

  const span = tracer.startSpan(spanName)

  res.on("finish", () => {
    span.end()
  })

  next()
})

authRouter.post("/login", async (req: Request, res: Response) => {
  const ip = req.originalIp
  const code = req.body.authCode
  const phone = checkedToPhoneNumber(req.body.phoneNumber)
  if (phone instanceof Error) return res.status(400).send("invalid phone")
  const loginResp = await Authentication.loginWithPhoneCookie({
    phone,
    code,
    ip,
  })
  if (loginResp instanceof Error) {
    return res.status(500).send({ error: mapError(loginResp).message })
  }

  try {
    const kratosCookies = parseKratosCookies(loginResp.cookiesToSendBackToClient)
    const kratosUserId: UserId | undefined = loginResp.kratosUserId
    const csrfCookie = kratosCookies.csrf()
    const kratosSessionCookie = kratosCookies.kratosSession()
    if (!csrfCookie || !kratosSessionCookie) {
      return res.status(500).send({ error: "Missing csrf or ory_kratos_session cookie" })
    }
    const kratosCookieStr = kratosCookies.kratosSessionAsString()
    const result = await validateKratosCookie(kratosCookieStr)
    if (result instanceof Error) {
      return res.status(500).send({ error: result.message })
    }
    res.cookie(
      kratosSessionCookie.name,
      kratosSessionCookie.value,
      kratosCookies.formatCookieOptions(kratosSessionCookie),
    )
    res.cookie(
      csrfCookie.name,
      csrfCookie.value,
      kratosCookies.formatCookieOptions(csrfCookie),
    )
    return res.send({
      identity: {
        id: kratosUserId,
        uid: kratosUserId,
        phoneNumber: phone,
      },
    })
  } catch (error) {
    recordExceptionInCurrentSpan({ error })
    return res.status(500).send({ result: "Error parsing cookies" })
  }
})

// Logout flow
// 1. Client app (web wallet/admin etc...) sends an HTTP GET
//    to http://localhost:4002/auth/logout with credentials: 'include'
// 2. The backend project logs the user out via kratos and
//    revokes the session via kratosAdmin
// 3. All the cookies are deleted via res.clearCookie
//    from the backend
// 4. The cookies should be magically deleted on the client
authRouter.get("/logout", async (req: Request, res: Response) => {
  let reqCookie = req.headers?.cookie
  if (!reqCookie) {
    return res.status(500).send({ error: "Missing csrf or ory_kratos_session cookie" })
  }
  try {
    reqCookie = decodeURIComponent(reqCookie)
    const logoutResp = await logoutCookie(reqCookie as SessionCookie)
    if (logoutResp instanceof Error)
      return res.status(500).send({ error: logoutResp.message })
    // manually clear all cookies for the client
    for (const cookieName of Object.keys(req.cookies)) {
      res.clearCookie(cookieName)
    }
    return res.status(200).send({
      result: "logout successful",
    })
  } catch (error) {
    recordExceptionInCurrentSpan({ error })
    return res.status(500).send({ error: "Error logging out" })
  }
})

// Helper endpoint to clear any lingering cookies like csrf
authRouter.get("/clearCookies", async (req, res) => {
  try {
    if (req.cookies) {
      for (const cookieName of Object.keys(req.cookies)) {
        res.clearCookie(cookieName)
      }
      return res.status(200).send({
        result: "Cookies cleared successfully",
      })
    }
  } catch (err) {
    return res.status(500).send({ result: "Error clearing cookies" })
  }
})

authRouter.post("/create/device-account", async (req: Request, res: Response) => {
  const ip = req.originalIp
  const user = basicAuth(req)

  if (!user?.name || !user?.pass) {
    return res.status(422).send({ error: "Bad input" })
  }

  const username = user.name
  const password = user.pass
  const deviceId = username

  try {
    const authToken = await Authentication.loginWithDevice({
      username,
      password,
      ip,
      deviceId,
    })
    if (authToken instanceof Error) {
      recordExceptionInCurrentSpan({ error: authToken })
      return res.status(500).send({ error: authToken.message })
    }
    addAttributesToCurrentSpan({ "login.deviceAccount": deviceId })
    return res.status(200).send({
      result: authToken,
    })
  } catch (err) {
    recordExceptionInCurrentSpan({ error: err })
    return res.status(500).send({ error: parseErrorMessageFromUnknown(err) })
  }
})

// TODO: should code request behind captcha or device token?
authRouter.post("/email/code", async (req: Request, res: Response) => {
  const ip = req.originalIp

  const emailRaw = req.body.email
  if (!emailRaw) {
    recordExceptionInCurrentSpan({ error: "Missing input" })
    return res.status(422).send({ error: "Missing input" })
  }

  const email = checkedToEmailAddress(emailRaw)
  if (email instanceof Error) {
    recordExceptionInCurrentSpan({ error: email.message })
    return res.status(422).send({ error: email.message })
  }

  try {
    const emailLoginId = await requestEmailCode({ email, ip })
    if (emailLoginId instanceof Error) {
      recordExceptionInCurrentSpan({ error: emailLoginId.message })
      return res.status(500).send({ error: emailLoginId.message })
    }
    return res.status(200).send({
      result: emailLoginId,
    })
  } catch (err) {
    recordExceptionInCurrentSpan({ error: err })
    return res.status(500).send({ error: err })
  }
})

authRouter.post("/email/login", async (req: Request, res: Response) => {
  const ip = req.originalIp

  const emailLoginIdRaw = req.body.emailLoginId
  if (!emailLoginIdRaw) {
    return res.status(422).send({ error: "Missing input" })
  }

  const emailLoginId = checkedToEmailLoginId(emailLoginIdRaw)
  if (emailLoginId instanceof Error) {
    return res.status(422).send({ error: emailLoginId.message })
  }

  const codeRaw = req.body.code
  if (!codeRaw) {
    return res.status(422).send({ error: "Missing input" })
  }

  const code = checkedToEmailCode(codeRaw)
  if (code instanceof Error) {
    return res.status(422).send({ error: code.message })
  }

  try {
    const result = await loginWithEmailToken({ ip, emailFlowId: emailLoginId, code })
    if (result instanceof EmailCodeInvalidError) {
      recordExceptionInCurrentSpan({ error: result })
      return res.status(401).send({ error: "invalid code" })
    }
    if (
      result instanceof EmailValidationSubmittedTooOftenError ||
      result instanceof UserLoginIpRateLimiterExceededError
    ) {
      recordExceptionInCurrentSpan({ error: result })
      return res.status(429).send({ error: "too many requests" })
    }
    if (result instanceof Error) {
      recordExceptionInCurrentSpan({ error: result })
      return res.status(500).send({ error: result.message })
    }
    const { authToken, totpRequired } = result
    return res.status(200).send({
      result: { authToken, totpRequired },
    })
  } catch (err) {
    recordExceptionInCurrentSpan({ error: err })
    return res.status(500).send({ error: parseErrorMessageFromUnknown(err) })
  }
})

authRouter.post("/totp/validate", async (req: Request, res: Response) => {
  const totpCodeRaw = req.body.totpCode
  if (!totpCodeRaw) {
    return res.status(422).send({ error: "Missing input" })
  }

  const totpCode = checkedToTotpCode(totpCodeRaw)
  if (totpCode instanceof Error) {
    return res.status(422).send({ error: totpCode.message })
  }

  const authTokenRaw = req.body.authToken
  if (!authTokenRaw) {
    return res.status(422).send({ error: "Missing input" })
  }

  const authToken = checkedToAuthToken(authTokenRaw)

  // FIXME return string currently when there is an error
  if (authToken === "Invalid value for AuthToken") {
    return res.status(422).send({ error: "Invalid value for AuthToken" })
  }

  try {
    const result = await elevatingSessionWithTotp({
      totpCode,
      authToken,
    })
    if (result instanceof EmailCodeInvalidError) {
      recordExceptionInCurrentSpan({ error: result })
      return res.status(401).send({ error: "invalid code" })
    }
    if (
      result instanceof EmailValidationSubmittedTooOftenError ||
      result instanceof UserLoginIpRateLimiterExceededError
    ) {
      recordExceptionInCurrentSpan({ error: result })
      return res.status(429).send({ error: "too many requests" })
    }
    if (result instanceof Error) {
      recordExceptionInCurrentSpan({ error: result })
      return res.status(500).send({ error: result.message })
    }
    return res.status(200).send()
  } catch (err) {
    recordExceptionInCurrentSpan({ error: err })
    return res.status(500).send({ error: parseErrorMessageFromUnknown(err) })
  }
})

authRouter.post("/email/login/cookie", async (req: Request, res: Response) => {
  const ip = req.originalIp

  const emailLoginIdRaw = req.body.emailLoginId
  if (!emailLoginIdRaw) {
    return res.status(422).send({ error: "Missing input" })
  }

  const emailLoginId = checkedToEmailLoginId(emailLoginIdRaw)
  if (emailLoginId instanceof Error) {
    return res.status(422).send({ error: emailLoginId.message })
  }

  const codeRaw = req.body.code
  if (!codeRaw) {
    return res.status(422).send({ error: "Missing input" })
  }

  const code = checkedToEmailCode(codeRaw)
  if (code instanceof Error) {
    return res.status(422).send({ error: code.message })
  }

  let loginResult: LoginWithEmailCookieResult | ApplicationError
  try {
    loginResult = await loginWithEmailCookie({ ip, emailFlowId: emailLoginId, code })
    if (loginResult instanceof EmailCodeInvalidError) {
      recordExceptionInCurrentSpan({ error: loginResult })
      return res.status(401).send({ error: "invalid code" })
    }
    if (
      loginResult instanceof EmailValidationSubmittedTooOftenError ||
      loginResult instanceof UserLoginIpRateLimiterExceededError
    ) {
      recordExceptionInCurrentSpan({ error: loginResult })
      return res.status(429).send({ error: "too many requests" })
    }
    if (loginResult instanceof Error) {
      recordExceptionInCurrentSpan({ error: loginResult })
      return res.status(500).send({ error: loginResult.message })
    }
  } catch (err) {
    recordExceptionInCurrentSpan({ error: err })
    return res.status(500).send({ error: parseErrorMessageFromUnknown(err) })
  }

  const { cookiesToSendBackToClient, kratosUserId, totpRequired } = loginResult
  let kratosCookies: KratosCookie
  try {
    kratosCookies = parseKratosCookies(cookiesToSendBackToClient)
  } catch (error) {
    recordExceptionInCurrentSpan({ error })
    return res.status(500).send({ result: "Error parsing cookies" })
  }
  const csrfCookie = kratosCookies.csrf()
  const kratosSessionCookie = kratosCookies.kratosSession()
  if (!csrfCookie || !kratosSessionCookie) {
    return res.status(500).send({ error: "Missing csrf or ory_kratos_session cookie" })
  }
  res.cookie(
    kratosSessionCookie.name,
    kratosSessionCookie.value,
    kratosCookies.formatCookieOptions(kratosSessionCookie),
  )
  res.cookie(
    csrfCookie.name,
    csrfCookie.value,
    kratosCookies.formatCookieOptions(csrfCookie),
  )
  return res.status(200).send({
    identity: {
      kratosUserId,
      totpRequired,
    },
  })
})

authRouter.post("/phone/captcha", async (req: Request, res: Response) => {
  const result = await registerCaptchaGeetest()
  if (result instanceof Error) return res.json({ error: "error creating challenge" })

  const { success, gt, challenge, newCaptcha } = result

  return {
    result: {
      id: gt,
      challengeCode: challenge,
      newCaptcha,
      failbackMode: success === 0,
    },
  }
})

authRouter.post("/phone/code", async (req: Request, res: Response) => {
  const ip = req.originalIp

  const phoneRaw = req.body.phone
  const challengeCodeRaw = req.body.challengeCode
  const validationCodeRaw = req.body.validationCode
  const secCodeRaw = req.body.secCode
  const channel = req.body.channel ?? "SMS"

  if (!phoneRaw || !challengeCodeRaw || !validationCodeRaw || !secCodeRaw)
    return res.status(400).send({ error: "missing inputs" })

  const phone = checkedToPhoneNumber(phoneRaw)
  if (phone instanceof Error) return res.status(400).send("invalid phone")

  const geetestChallenge = challengeCodeRaw
  const geetestValidate = validationCodeRaw
  const geetestSeccode = secCodeRaw

  const result = await Authentication.requestPhoneCodeWithCaptcha({
    phone,
    geetestChallenge,
    geetestValidate,
    geetestSeccode,
    ip,
    channel,
  })

  if (result instanceof Error) return res.status(400).json({ error: result })

  return res.json({
    success: true,
  })
})

authRouter.post("/phone/login", async (req: Request, res: Response) => {
  const ip = req.originalIp

  const codeRaw = req.body.code
  const phoneRaw = req.body.phone
  if (!codeRaw || !phoneRaw) {
    return res.status(400).send({ error: "missing inputs" })
  }
  const code = validOneTimeAuthCodeValue(codeRaw)
  if (code instanceof Error) return res.status(400).send("invalid code")
  const phone = checkedToPhoneNumber(phoneRaw)
  if (phone instanceof Error) return res.status(400).send("invalid phone")

  const loginResp = await Authentication.loginWithPhoneToken({
    phone,
    code,
    ip,
  })
  if (loginResp instanceof Error) {
    return res.status(500).send({ error: mapError(loginResp).message })
  }

  const { authToken, totpRequired } = loginResp

  return res.send({
    authToken,
    totpRequired,
  })
})

export default authRouter
