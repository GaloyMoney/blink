import express from "express"

import { isProd } from "@config"

import { recordExceptionInCurrentSpan, wrapAsyncToRunInSpan } from "@services/tracing"

import { parseIps } from "@domain/accounts-ips"

import { checkedToEmailAddress } from "@domain/users"
import { loginWithEmail, requestEmailCode } from "@app/auth"

import { parseErrorMessageFromUnknown } from "@domain/shared"

import { checkedToEmailCode } from "@domain/auth"
import { checkedToFlowId } from "@services/kratos"

import { baseLogger } from "@services/logger"

import {
  EmailCodeInvalidError,
  EmailValidationSubmittedTooOftenError,
} from "@domain/auth/errors"

import { UserLoginIpRateLimiterExceededError } from "@domain/rate-limit/errors"

import { authRouter } from "./router"

// TODO: should code request behind captcha or device token?
authRouter.post(
  "/email/code-request",
  wrapAsyncToRunInSpan({
    namespace: "servers.middlewares.authRouter",
    fnName: "emailCodeRequest",
    fn: async (req: express.Request, res: express.Response) => {
      baseLogger.info("/email/code-request")

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
        const flowId = await requestEmailCode({ email, ip })
        if (flowId instanceof Error) {
          recordExceptionInCurrentSpan({ error: flowId })
          return res.status(500).send({ error: flowId.message })
        }
        return res.status(200).send({
          result: flowId,
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

      const flowRaw = req.body.flow
      if (!flowRaw) {
        return res.status(422).send({ error: "Missing input" })
      }

      const flow = checkedToFlowId(flowRaw)
      if (flow instanceof Error) {
        return res.status(422).send({ error: flow.message })
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
        const result = await loginWithEmail({ ip, flow, code })
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

export default {}
