import cors from "cors"
import express from "express"

import * as jwt from "jsonwebtoken"

import { Users } from "@app"
import { getKratosConfig, isDev, JWT_SECRET } from "@config"
import { parseIps } from "@domain/users-ips"
import {
  KratosError,
  LikelyNoUserWithThisPhoneExistError,
} from "@domain/authentication/errors"

import { mapError } from "@graphql/error-map"
import { baseLogger } from "@services/logger"
import { addAttributesToCurrentSpan, wrapAsyncToRunInSpan } from "@services/tracing"

import { AccountsRepository, UsersRepository } from "@services/mongoose"
import { kratosPublic } from "@services/kratos/private"
import { AuthWithPhonePasswordlessService, validateKratosToken } from "@services/kratos"

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

      let kratosUserId: KratosUserId | undefined

      if (!account.kratosUserId) {
        const user = await UsersRepository().findById(account.id as string as UserId)
        if (user instanceof Error) {
          res.status(401).send({ error: `${user.name} ${user.message}` })
          return
        }

        const authService = AuthWithPhonePasswordlessService()
        const phone = user.phone

        if (!phone) {
          res.status(401).send({ error: `phone is missing` })
          return
        }

        const kratosRes = await authService.login(phone)

        if (kratosRes instanceof LikelyNoUserWithThisPhoneExistError) {
          // expected to fail pre migration.
          // post migration: not going into this loop because kratosUserId would exist

          const kratosUserId_ = await authService.createIdentityNoSession(phone)
          if (kratosUserId_ instanceof Error) {
            res
              .status(401)
              .send({ error: `${kratosUserId_.name} ${kratosUserId_.message}` })
            return
          }

          kratosUserId = kratosUserId_

          const accountRes = await AccountsRepository().update({
            ...account,
            kratosUserId,
          })

          if (accountRes instanceof Error) {
            res.status(401).send({ error: `${accountRes.name} ${accountRes.message}` })
            return
          }
        }
      }

      addAttributesToCurrentSpan({ token: "jwt" })

      res.json({ sub: kratosUserId || account.kratosUserId })
    },
  }),
)

export default authRouter
