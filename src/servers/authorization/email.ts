import cors from "cors"
import express from "express"

import { recordExceptionInCurrentSpan, wrapAsyncToRunInSpan } from "@services/tracing"

import { parseIps } from "@domain/accounts-ips"

import {
  elevatingSessionWithTotp,
  loginWithEmail,
  loginWithEmailCookie,
  requestEmailCode,
} from "@app/authentication"
import { checkedToEmailAddress } from "@domain/users"

import { parseErrorMessageFromUnknown } from "@domain/shared"

import { checkedToEmailCode } from "@domain/authentication"
import {
  checkedToAuthToken,
  checkedToEmailLoginId,
  checkedToTotpCode,
} from "@services/kratos"

import { baseLogger } from "@services/logger"

import {
  EmailCodeInvalidError,
  EmailValidationSubmittedTooOftenError,
} from "@domain/authentication/errors"

import { UserLoginIpRateLimiterExceededError } from "@domain/rate-limit/errors"
import { parseKratosCookies } from "@services/kratos/cookie"

import bodyParser from "body-parser"

import cookieParser from "cookie-parser"

import { UNSECURE_IP_FROM_REQUEST_OBJECT } from "@config"

import { authRouter } from "./router"

authRouter.use(cors({ origin: true, credentials: true }))
authRouter.use(bodyParser.urlencoded({ extended: true }))
authRouter.use(bodyParser.json())
authRouter.use(cookieParser())

// TODO: should code request behind captcha or device token?
authRouter.post(
  "/email/code",
  wrapAsyncToRunInSpan({
    namespace: "servers.middlewares.authRouter",
    fnName: "emailCodeRequest",
    fn: async (req: express.Request, res: express.Response) => {
      baseLogger.info("/email/code")

      const ipString = UNSECURE_IP_FROM_REQUEST_OBJECT
        ? req?.ip
        : req?.headers["x-real-ip"]
      const ip = parseIps(ipString)

      if (!ip) {
        recordExceptionInCurrentSpan({ error: "IP is not defined" })
        return res.status(500).send({ error: "IP is not defined" })
      }

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
    },
  }),
)

authRouter.post(
  "/email/login",
  wrapAsyncToRunInSpan({
    namespace: "servers.middlewares.authRouter",
    fnName: "emailLogin",
    fn: async (req: express.Request, res: express.Response) => {
      baseLogger.info("/email/login")

      const ipString = UNSECURE_IP_FROM_REQUEST_OBJECT
        ? req?.ip
        : req?.headers["x-real-ip"]
      const ip = parseIps(ipString)

      if (!ip) {
        recordExceptionInCurrentSpan({ error: "IP is not defined" })
        return res.status(500).send({ error: "IP is not defined" })
      }

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
        const result = await loginWithEmail({ ip, emailFlowId: emailLoginId, code })
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
    },
  }),
)

authRouter.post(
  "/totp/validate",
  wrapAsyncToRunInSpan({
    namespace: "servers.middlewares.authRouter",
    fnName: "totpValidate",
    fn: async (req: express.Request, res: express.Response) => {
      baseLogger.info("/totp/validate")

      const ipString = UNSECURE_IP_FROM_REQUEST_OBJECT
        ? req?.ip
        : req?.headers["x-real-ip"]
      const ip = parseIps(ipString)

      if (!ip) {
        recordExceptionInCurrentSpan({ error: "IP is not defined" })
        return res.status(500).send({ error: "IP is not defined" })
      }

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
    },
  }),
)

authRouter.post(
  "/email/login/cookie",
  wrapAsyncToRunInSpan({
    namespace: "servers.middlewares.authRouter",
    fnName: "emailLoginCookie",
    fn: async (req: express.Request, res: express.Response) => {
      baseLogger.info("/email/login/cookie")

      const ipString = UNSECURE_IP_FROM_REQUEST_OBJECT
        ? req?.ip
        : req?.headers["x-real-ip"]
      const ip = parseIps(ipString)

      if (!ip) {
        recordExceptionInCurrentSpan({ error: "IP is not defined" })
        return res.status(500).send({ error: "IP is not defined" })
      }

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

      let loginResult
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
      let kratosCookies
      try {
        kratosCookies = parseKratosCookies(cookiesToSendBackToClient)
      } catch (error) {
        recordExceptionInCurrentSpan({ error })
        return res.status(500).send({ result: "Error parsing cookies" })
      }
      const csrfCookie = kratosCookies.csrf()
      const kratosSessionCookie = kratosCookies.kratosSession()
      if (!csrfCookie || !kratosSessionCookie) {
        return res
          .status(500)
          .send({ error: "Missing csrf or ory_kratos_session cookie" })
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
    },
  }),
)

export default {}
