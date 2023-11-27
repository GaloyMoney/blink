import cors from "cors"
import express, { NextFunction, Request, Response } from "express"

import basicAuth from "basic-auth"

import bodyParser from "body-parser"

import { Authentication } from "@/app"

import { mapError } from "@/graphql/error-map"
import {
  addAttributesToCurrentSpan,
  recordExceptionInCurrentSpan,
  tracer,
} from "@/services/tracing"

import {
  elevatingSessionWithTotp,
  loginWithEmailToken,
  requestEmailCode,
} from "@/app/authentication"
import { parseIps } from "@/domain/accounts-ips"
import { checkedToEmailAddress, checkedToPhoneNumber } from "@/domain/users"

import {
  checkedToAuthToken,
  checkedToEmailLoginId,
  checkedToTotpCode,
} from "@/services/kratos"

import { UNSECURE_IP_FROM_REQUEST_OBJECT } from "@/config"

import { parseErrorMessageFromUnknown } from "@/domain/shared"

import { checkedToEmailCode, validOneTimeAuthCodeValue } from "@/domain/authentication"

import {
  EmailCodeInvalidError,
  EmailValidationSubmittedTooOftenError,
} from "@/domain/authentication/errors"

import { UserLoginIpRateLimiterExceededError } from "@/domain/rate-limit/errors"

import { registerCaptchaGeetest } from "@/app/captcha"

const authRouter = express.Router({ caseSensitive: true })

authRouter.use(cors({ origin: true, credentials: true }))
authRouter.use(bodyParser.urlencoded({ extended: true }))
authRouter.use(bodyParser.json())

authRouter.use((req: Request, res: Response, next: NextFunction) => {
  const ipString = UNSECURE_IP_FROM_REQUEST_OBJECT ? req.ip : req.headers["x-real-ip"]
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

authRouter.post("/create/device-account", async (req: Request, res: Response) => {
  const appcheckJti = req.headers["x-appcheck-jti"]
  addAttributesToCurrentSpan({ "appcheck.jti": appcheckJti })

  if (!appcheckJti || typeof appcheckJti !== "string") {
    return res.status(401).send({ error: "missing or invalid appcheck jti" })
  }

  const ip = req.originalIp
  const user = basicAuth(req)

  if (!user) {
    return res.status(422).send({ error: "user undefined" })
  }

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
      appcheckJti,
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
    const { authToken, totpRequired, id } = result
    return res.status(200).send({
      result: { authToken, totpRequired, id },
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

authRouter.post("/phone/captcha", async (req: Request, res: Response) => {
  const result = await registerCaptchaGeetest()
  if (result instanceof Error)
    return res.status(500).json({ error: "error creating challenge" })

  const { success, gt, challenge, newCaptcha } = result

  return res.send({
    result: {
      id: gt,
      challengeCode: challenge,
      newCaptcha,
      failbackMode: success === 0,
    },
  })
})

authRouter.post("/phone/code", async (req: Request, res: Response) => {
  const ip = req.originalIp
  const phoneRaw = req.body.phone
  const challengeCodeRaw = req.body.challengeCode
  const validationCodeRaw = req.body.validationCode
  const secCodeRaw = req.body.secCode

  // TODO: proper validation
  const channel =
    typeof req.body.channel === "string" ? req.body.channel.toLowerCase() : "sms"

  if (!phoneRaw || !challengeCodeRaw || !validationCodeRaw || !secCodeRaw)
    return res.status(400).send({ error: "missing inputs" })

  const phone = checkedToPhoneNumber(phoneRaw)
  if (phone instanceof Error) return res.status(400).send({ error: "invalid phone" })

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

authRouter.post("/phone/code-appcheck", async (req: Request, res: Response) => {
  const appcheckJti = req.headers["x-appcheck-jti"]
  if (!appcheckJti || typeof appcheckJti !== "string") {
    const error = "missing or invalid appcheck jti"
    recordExceptionInCurrentSpan({ error })
    return res.status(400).send({ error })
  }

  const ip = req.originalIp
  const phoneRaw = req.body.phone

  // TODO: proper validation
  const channel =
    typeof req.body.channel === "string" ? req.body.channel.toLowerCase() : "sms"

  if (!phoneRaw) {
    const error = "missing phone input"
    recordExceptionInCurrentSpan({ error })
    return res.status(400).send({ error })
  }

  const phone = checkedToPhoneNumber(phoneRaw)
  if (phone instanceof Error) {
    const error = "invalid phone"
    recordExceptionInCurrentSpan({ error })
    return res.status(400).send({ error })
  }

  const result = await Authentication.requestPhoneCodeWithAppcheckJti({
    phone,
    appcheckJti,
    ip,
    channel,
  })

  if (result instanceof Error) {
    recordExceptionInCurrentSpan({ error: result })
    return res.status(400).json({ error: result.name })
  }

  return res.json({
    success: true,
  })
})

authRouter.post("/phone/login", async (req: Request, res: Response) => {
  const ip = req.originalIp
  const codeRaw = req.body.code
  const phoneRaw = req.body.phone
  if (!codeRaw || !phoneRaw) {
    const error = "missing inputs"
    recordExceptionInCurrentSpan({ error })
    return res.status(400).send({ error })
  }
  const code = validOneTimeAuthCodeValue(codeRaw)
  if (code instanceof Error) return res.status(400).json({ error: "invalid code" })
  const phone = checkedToPhoneNumber(phoneRaw)
  if (phone instanceof Error) return res.status(400).json({ error: "invalid phone" })

  const loginResp = await Authentication.loginWithPhoneToken({
    phone,
    code,
    ip,
  })
  if (loginResp instanceof Error) {
    return res.status(500).send({ error: mapError(loginResp).message })
  }

  const { authToken, totpRequired, id } = loginResp

  return res.send({
    authToken,
    totpRequired,
    id,
  })
})

export default authRouter
