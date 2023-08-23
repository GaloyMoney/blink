import express from "express"

import { Authentication } from "@app"

import {
  addAttributesToCurrentSpan,
  recordExceptionInCurrentSpan,
  wrapAsyncToRunInSpan,
} from "@services/tracing"

import { parseIps } from "@domain/accounts-ips"

import basicAuth from "basic-auth"

import { parseErrorMessageFromUnknown } from "@domain/shared"

import { UNSECURE_IP_FROM_REQUEST_OBJECT } from "@config"

import { authRouter } from "./router"

authRouter.post(
  "/create/device-account",
  wrapAsyncToRunInSpan({
    namespace: "servers.middlewares.authRouter",
    fnName: "createDeviceAccount",
    fn: async (req: express.Request, res: express.Response) => {
      const ipString = UNSECURE_IP_FROM_REQUEST_OBJECT
        ? req?.ip
        : req?.headers["x-real-ip"]
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
    },
  }),
)

export default {}
