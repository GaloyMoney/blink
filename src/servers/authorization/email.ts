import express from "express"

import { isProd } from "@config"

import { recordExceptionInCurrentSpan, wrapAsyncToRunInSpan } from "@services/tracing"

import { parseIps } from "@domain/accounts-ips"

import { checkedToEmailAddress } from "@domain/users"
import {
  elevatingSessionWithTotp,
  loginWithEmail,
  requestEmailCode,
} from "@app/authentication"

import { parseErrorMessageFromUnknown } from "@domain/shared"

import { checkedToEmailCode } from "@domain/authentication"
import {
  checkedToEmailLoginId,
  checkedToSessionToken,
  checkedToTotpCode,
} from "@services/kratos"

import { baseLogger } from "@services/logger"

import {
  EmailCodeInvalidError,
  EmailValidationSubmittedTooOftenError,
} from "@domain/authentication/errors"

import { UserLoginIpRateLimiterExceededError } from "@domain/rate-limit/errors"

import { authRouter } from "./router"

// TODO: should code request behind captcha or device token?
authRouter.post(
  "/email/code",
  wrapAsyncToRunInSpan({
    namespace: "servers.middlewares.authRouter",
    fnName: "emailCodeRequest",
    fn: async (req: express.Request, res: express.Response) => {
      baseLogger.info("/email/code")

      const ipString = isProd ? req?.headers["x-real-ip"] : req?.ip
      const ip = parseIps(ipString)

      if (!ip) {
        return res.status(500).send({ error: "IP is not defined" })
      }

      const emailRaw = req.body.email
      if (!emailRaw) {
        return res.status(422).send({ error: "Missing input" })
      }

      const email = checkedToEmailAddress(emailRaw)
      if (email instanceof Error) {
        return res.status(422).send({ error: email.message })
      }

      try {
        const emailLoginId = await requestEmailCode({ email, ip })
        if (emailLoginId instanceof Error) {
          recordExceptionInCurrentSpan({ error: emailLoginId })
          return res.status(500).send({ error: emailLoginId.message })
        }
        return res.status(200).send({
          result: emailLoginId,
        })
      } catch (err) {
        recordExceptionInCurrentSpan({ error: err })
        return res.status(500).send({ error: parseErrorMessageFromUnknown(err) })
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

      const ipString = isProd ? req?.headers["x-real-ip"] : req?.ip
      const ip = parseIps(ipString)

      if (!ip) {
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
        const { sessionToken, totpRequired } = result
        return res.status(200).send({
          result: { sessionToken, totpRequired },
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

      const ipString = isProd ? req?.headers["x-real-ip"] : req?.ip
      const ip = parseIps(ipString)

      if (!ip) {
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

      const sessionTokenRaw = req.body.sessionToken
      if (!sessionTokenRaw) {
        return res.status(422).send({ error: "Missing input" })
      }

      const sessionToken = checkedToSessionToken(sessionTokenRaw)

      // FIXME return string currently when there is an error
      if (sessionToken === "Invalid value for AuthToken") {
        return res.status(422).send({ error: "Invalid value for AuthToken" })
      }

      try {
        const result = await elevatingSessionWithTotp({
          totpCode,
          sessionToken,
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

export default {}
