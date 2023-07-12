import express from "express"

import { Auth } from "@app"
import { isProd } from "@config"

import {
  addAttributesToCurrentSpan,
  recordExceptionInCurrentSpan,
  wrapAsyncToRunInSpan,
} from "@services/tracing"

import { parseIps } from "@domain/accounts-ips"

import basicAuth from "basic-auth"

import { parseErrorMessageFromUnknown } from "@domain/shared"

import { authRouter } from "./router"

authRouter.post(
  "/create/device-account",
  wrapAsyncToRunInSpan({
    namespace: "servers.middlewares.authRouter",
    fnName: "createDeviceAccount",
    fn: async (req: express.Request, res: express.Response) => {
      const ipString = isProd ? req?.headers["x-real-ip"] : req?.ip
      const ip = parseIps(ipString)

      if (!ip) {
        return res.status(500).send({ error: "IP is not defined" })
      }

      const user = basicAuth(req)

      if (!user?.name || !user?.pass) {
        return res.status(422).send({ error: "Bad input" })
      }

      const username = user.name
      const password = user.pass
      const deviceId = username

      try {
        const authToken = await Auth.loginWithDevice({
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
    },
  }),
)

export default {}
