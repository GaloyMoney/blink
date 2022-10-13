import cors from "cors"
import express from "express"

import * as jwt from "jsonwebtoken"

import { Users } from "@app"
import { getKratosConfig, isDev, JWT_SECRET } from "@config"
import { parseIps } from "@domain/users-ips"
import { mapError } from "@graphql/error-map"
import { baseLogger } from "@services/logger"
import { wrapAsyncToRunInSpan } from "@services/tracing"

import { AccountsRepository } from "@services/mongoose"
import { kratosPublic } from "@services/kratos/private"
import { KratosError } from "@services/kratos/errors"
import { validateKratosToken } from "@services/kratos"

const graphqlLogger = baseLogger.child({
  module: "graphql",
})

const authRouter = express.Router({ caseSensitive: true })

const { corsAllowedOrigins } = getKratosConfig()

authRouter.use(cors({ origin: corsAllowedOrigins, credentials: true }))

authRouter.post("/browser", async (req, res) => {
  const ipString = isDev ? req?.ip : req?.headers["x-real-ip"]
  const ip = parseIps(ipString)

  if (ip === undefined) {
    throw new Error("IP is not defined")
  }

  const logger = graphqlLogger.child({ ip, body: req.body })

  try {
    const { data } = await kratosPublic.toSession(undefined, req.header("Cookie"))

    const kratosLoginResp = await Users.loginWithEmail({
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

// used by oathkeeper to validate LegacyJWT and SessionToken
// should not be public
authRouter.post(
  "/validatetoken",
  wrapAsyncToRunInSpan({
    namespace: "validatetoken",
    fn: async (req: express.Request, res: express.Response) => {
      const accountsRepo = AccountsRepository()
      const headers = req?.headers
      let tokenPayload: string | jwt.JwtPayload | null = null
      const authz = headers.authorization || headers.Authorization

      if (!authz) {
        res.status(401).send({ error: "Missing token" })
        return
      }

      const rawToken = authz.slice(7) as string

      // new flow
      if (rawToken.length === 32) {
        const kratosRes = await validateKratosToken(rawToken as SessionToken)

        if (!(kratosRes instanceof KratosError)) {
          const account = await accountsRepo.findByKratosUserId(kratosRes.kratosUserId)

          if (account instanceof Error) {
            return res.status(401).send({ error: account.message })
          }

          res.json({ sub: account.id })
          return
        }
      }

      // legacy flow
      try {
        tokenPayload = jwt.verify(rawToken, JWT_SECRET, {
          algorithms: jwtAlgorithms,
        })
      } catch (err) {
        res.status(401).send({ error: "Token validation error" })
        return
      }

      if (typeof tokenPayload === "string") {
        res.status(401).send({ error: "tokenPayload should be an object" })
        return
      }

      if (!tokenPayload) {
        res.status(401).send({ error: "Token validation error" })
        return
      }

      // the sub (subject) sent to oathkeeper as a response is the uid from the original token
      // which is the AccountId
      res.json({ sub: tokenPayload.uid })
    },
  }),
)

export default authRouter
