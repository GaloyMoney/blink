import { Configuration, V0alpha2Api, V0alpha2ApiInterface } from "@ory/client"
import cors from "cors"
import express from "express"

import { Users } from "@app"
import { getKratosConfig, isDev, JWT_SECRET } from "@config"
import { parseIps } from "@domain/users-ips"
import { mapError } from "@graphql/error-map"
import { baseLogger } from "@services/logger"

import * as jwt from "jsonwebtoken"

export const KratosSdk: (kratosEndpoint?: string) => V0alpha2ApiInterface = (
  kratosEndpoint,
) => new V0alpha2Api(new Configuration({ basePath: kratosEndpoint }))

const graphqlLogger = baseLogger.child({
  module: "graphql",
})

const { serverURL, corsAllowedOrigins } = getKratosConfig()

const authRouter = express.Router({ caseSensitive: true })

authRouter.use(cors({ origin: corsAllowedOrigins, credentials: true }))

authRouter.post("/browser", async (req, res) => {
  const kratos = KratosSdk(serverURL)

  const ipString = isDev ? req?.ip : req?.headers["x-real-ip"]
  const ip = parseIps(ipString)

  if (ip === undefined) {
    throw new Error("IP is not defined")
  }

  const logger = graphqlLogger.child({ ip, body: req.body })

  try {
    const { data } = await kratos.toSession(undefined, req.header("Cookie"))

    const kratosLoginResp = await Users.loginWithKratos({
      kratosUserId: data.identity.id,
      emailAddress: data.identity.traits.email,
      logger,
      ip,
    })

    if (kratosLoginResp instanceof Error) {
      return res.send({ error: mapError(kratosLoginResp) })
    }

    res.send({ kratosUserId: data.identity.id, ...kratosLoginResp })
  } catch (error) {
    res.send({ error: "Browser auth error" })
  }
})

const jwtAlgorithms: jwt.Algorithm[] = ["HS256"]

// use for oathkeeper
authRouter.post("/validatejwt", async (req, res) => {
  // TODO: should only respond to oathkeeper

  // const ipString = isDev ? req?.ip : req?.headers["x-real-ip"]
  // const ip = parseIps(ipString)

  // if (ip === undefined) {
  //   throw new Error("IP is not defined")
  // }

  const headers = req?.headers
  let tokenPayload: string | jwt.JwtPayload | null = null
  const authz = headers.authorization || headers.Authorization
  if (authz) {
    try {
      const rawToken = authz.slice(7) as string

      tokenPayload = jwt.verify(rawToken, JWT_SECRET, {
        algorithms: jwtAlgorithms,
      })
    } catch (err) {
      console.log("can't decode token")
    }

    console.log({ tokenPayload }, "tokenPayload")

    if (typeof tokenPayload === "string") {
      throw new Error("tokenPayload should be an object")
    }
  }
  if (tokenPayload) {
    res.json({ subject: "", extra: { uid: tokenPayload.uid } })
  } else {
    res.status(401).send({ error: "Token validation error" })
  }
})

export default authRouter
