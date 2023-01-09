import cors from "cors"
import express from "express"

import * as jwt from "jsonwebtoken"

import { Auth } from "@app"
import { getKratosConfig, isDev, JWT_SECRET } from "@config"

import { mapError } from "@graphql/error-map"
import { addAttributesToCurrentSpan, wrapAsyncToRunInSpan } from "@services/tracing"

import { AuthWithPhonePasswordlessService, validateKratosToken } from "@services/kratos"
import { kratosPublic } from "@services/kratos/private"
import { AccountsRepository } from "@services/mongoose"
import { parseIps } from "@domain/accounts-ips"
import { KratosError } from "@services/kratos/errors"
import cookie from "cookie"
import bodyParser from "body-parser"
import { isCodeValid } from "@app/auth"

const authRouter = express.Router({ caseSensitive: true })

const { corsAllowedOrigins } = getKratosConfig()

authRouter.use(cors({ origin: corsAllowedOrigins, credentials: true }))
authRouter.use(bodyParser.urlencoded({ extended: true }))
authRouter.use(bodyParser.json())

// deprecated
authRouter.post("/browser", async (req, res) => {
  const ipString = isDev ? req?.ip : req?.headers["x-real-ip"]
  const ip = parseIps(ipString)

  if (ip === undefined) {
    throw new Error("IP is not defined")
  }

  try {
    const { data } = await kratosPublic.toSession({ cookie: req.header("Cookie") })

    const kratosLoginResp = await Auth.loginWithEmail({
      kratosUserId: data.identity.id,
      emailAddress: data.identity.traits.email,
      ip,
    })

    if (kratosLoginResp instanceof Error) {
      return res.send({ error: mapError(kratosLoginResp).message })
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

authRouter.post("/cookieLogin", async (req, res) => {
  const phone = req.body.phone as PhoneNumber
  const code = req.body.code
  const validCode = await isCodeValid({ phone, code })
  if (validCode instanceof Error) {
    // TODO loop and clear cookies to prevent error on client
    return res.status(500).send(JSON.stringify(validCode))
  }
  const authService = AuthWithPhonePasswordlessService()
  const loginRes = await authService.loginCookie(phone)
  if (loginRes instanceof Error) {
    // TODO loop and clear cookies to prevent error on client
    return res.status(500).send(JSON.stringify(loginRes))
  }
  const cookies = loginRes.cookieToSendBackToClient
  const clientCsrfCookie = cookie.parse(cookies[0])
  const clientOrySessionCookie = cookie.parse(cookies[1])
  res.cookie("ory_kratos_session", clientOrySessionCookie.ory_kratos_session, {
    expires: new Date(Date.now() + 900000), // TODO parse this date - clientOrySessionCookie.Expires,
    sameSite: "strict", // TODO Lax or none
    secure: true,
    httpOnly: true,
    path: clientOrySessionCookie.Path,
  })
  const csrfKey = Object.keys(clientCsrfCookie)[0]
  const csrfValue = Object.values(clientCsrfCookie)[0]
  res.cookie(csrfKey, csrfValue, {
    maxAge: clientOrySessionCookie["Max-Age"], // TODO look this up from downstream
    sameSite: "strict", // TODO Lax or none
    secure: true,
    httpOnly: true,
    path: clientOrySessionCookie.Path,
  })

  if (isDev) {
    res.set({
      "access-control-allow-credentials": "true",
      "access-control-allow-methods": "PUT GET HEAD POST DELETE OPTIONS",
      "access-control-allow-origin": "http://localhost:3000",
    })
  }
  res.status(200).send(JSON.stringify({ kratosUserId: loginRes.kratosUserId, phone }))
})

authRouter.get("/cookieLogout", async (req, res) => {
  const cookiesStr = req.headers.cookie
  if (cookiesStr?.includes("kratos") || cookiesStr?.includes("csrf")) {
    const cookies = cookie.parse(cookiesStr)
    for (const c of Object.keys(cookies)) {
      if (c.includes("kratos") || c.includes("csrf")) {
        res.clearCookie(c)
      }
    }
  } else {
    return res.status(200).send(JSON.stringify({ result: "no cookies" }))
  }
  if (isDev) {
    res.set({
      "access-control-allow-credentials": "true",
      "access-control-allow-methods": "PUT GET HEAD POST DELETE OPTIONS",
      "access-control-allow-origin": "http://localhost:3000",
    })
  }
  res.status(200).send(JSON.stringify({ result: "cookies deleted" }))
})

export default authRouter
