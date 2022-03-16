import express from "express"
import cors from "cors"
import { Configuration } from "@ory/client"
import { V0alpha2ApiInterface, V0alpha2Api } from "@ory/kratos-client"

import { Users } from "@app"
import { baseLogger } from "@services/logger"
import { isDev, getKratosConfig } from "@config"
import { parseIps } from "@domain/users-ips"

export const KratosSdk: (kratosEndpoint?: string) => V0alpha2ApiInterface = (
  kratosEndpoint,
) =>
  new V0alpha2Api(
    new Configuration({ basePath: kratosEndpoint }),
  ) as unknown as V0alpha2ApiInterface

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

    const authToken = await Users.loginWithKratos({
      kratosUserId: data.identity.id,
      emailAddress: data.identity.traits.email,
      logger,
      ip,
    })

    if (authToken instanceof Error) {
      throw authToken
    }

    res.send({ authToken })
  } catch (error) {
    res.send({ error: "Browser auth error" })
  }
})

export default authRouter
