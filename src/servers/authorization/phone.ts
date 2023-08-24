import { recordExceptionInCurrentSpan, wrapAsyncToRunInSpan } from "@services/tracing"

import express from "express"

import { UNSECURE_IP_FROM_REQUEST_OBJECT } from "@config"
import { parseIps } from "@domain/accounts-ips"
import { checkedToPhoneNumber } from "@domain/users"
import { Authentication } from "@app/index"

import { mapError } from "@graphql/error-map"

import { validOneTimeAuthCodeValue } from "@domain/authentication"

import { registerCaptchaGeetest } from "@app/captcha"

import { authRouter } from "./router"

authRouter.post(
  "/phone/captcha",
  wrapAsyncToRunInSpan({
    namespace: "servers.middlewares.authRouter",
    fnName: "login",
    fn: async (req: express.Request, res: express.Response) => {
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
    },
  }),
)

authRouter.post(
  "/phone/code",
  wrapAsyncToRunInSpan({
    namespace: "servers.middlewares.authRouter",
    fnName: "login",
    fn: async (req: express.Request, res: express.Response) => {
      const ipString = UNSECURE_IP_FROM_REQUEST_OBJECT
        ? req?.ip
        : req?.headers["x-real-ip"]
      const ip = parseIps(ipString)
      if (!ip) {
        recordExceptionInCurrentSpan({ error: "IP is not defined" })
        return res.status(500).send({ error: "IP is not defined" })
      }

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
    },
  }),
)

authRouter.post(
  "/phone/login",
  wrapAsyncToRunInSpan({
    namespace: "servers.middlewares.authRouter",
    fnName: "login",
    fn: async (req: express.Request, res: express.Response) => {
      const ipString = UNSECURE_IP_FROM_REQUEST_OBJECT
        ? req?.ip
        : req?.headers["x-real-ip"]
      const ip = parseIps(ipString)
      if (!ip) {
        recordExceptionInCurrentSpan({ error: "IP is not defined" })
        return res.status(500).send({ error: "IP is not defined" })
      }
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
    },
  }),
)

export default {}
