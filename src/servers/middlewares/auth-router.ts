import cors from "cors"
import express from "express"

import * as jwt from "jsonwebtoken"

import { Auth } from "@app"
import { getKratosConfig, isDev, JWT_SECRET } from "@config"

import { mapError } from "@graphql/error-map"
import { addAttributesToCurrentSpan, wrapAsyncToRunInSpan } from "@services/tracing"

import { validateKratosToken } from "@services/kratos"
import { kratosPublic } from "@services/kratos/private"
import { AccountsRepository } from "@services/mongoose"
import { parseIps } from "@domain/accounts-ips"
import { KratosError } from "@services/kratos/errors"

const authRouter = express.Router({ caseSensitive: true })

const { corsAllowedOrigins } = getKratosConfig()

authRouter.use(cors({ origin: corsAllowedOrigins, credentials: true }))

authRouter.post("/browser", async (req, res) => {
  const ipString = isDev ? req?.ip : req?.headers["x-real-ip"]
  const ip = parseIps(ipString)

  if (ip === undefined) {
    throw new Error("IP is not defined")
  }

  try {
    const { data } = await kratosPublic.toSession(undefined, req.header("Cookie"))

    const kratosLoginResp = await Auth.loginWithEmail({
      kratosUserId: data.identity.id,
      emailAddress: data.identity.traits.email,
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
        if (kratosRes instanceof KratosError) {
          res.status(401).send({ error: `${kratosRes.name} ${kratosRes.message}` })
          return
        }

        addAttributesToCurrentSpan({ token: "kratos" })

        res.json({ sub: kratosRes.kratosUserId })
        return
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

      const account = await AccountsRepository().findById(tokenPayload.uid)
      if (account instanceof Error) {
        res.status(401).send({ error: `${account.name} ${account.message}` })
        return
      }

      res.json({ sub: account.kratosUserId })
    },
  }),
)

export default authRouter
