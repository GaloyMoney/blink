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
import bodyParser from "body-parser"
import setCookie from "set-cookie-parser"
import cookieParser from "cookie-parser"
import { logoutCookie } from "@app/auth"
import { checkedToPhoneNumber } from "@domain/users"

const authRouter = express.Router({ caseSensitive: true })

const { corsAllowedOrigins } = getKratosConfig()

authRouter.use(cors({ origin: corsAllowedOrigins, credentials: true }))
authRouter.use(bodyParser.urlencoded({ extended: true }))
authRouter.use(bodyParser.json())
authRouter.use(cookieParser())

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

authRouter.post(
  "/login",
  wrapAsyncToRunInSpan({
    namespace: "auth-router",
    fn: async (req: express.Request, res: express.Response) => {
      try {
        const ipString = isDev ? req?.ip : req?.headers["x-real-ip"]
        const ip = parseIps(ipString)
        if (ip === undefined) {
          throw new Error("IP is not defined")
        }

        const code = req.body.authCode
        const phone = checkedToPhoneNumber(req.body.phoneNumber)
        if (phone instanceof Error) return res.status(400).send("invalid phone")

        const loginResp = await Auth.loginWithPhoneCookie({
          phone,
          code,
          ip,
        })

        if (loginResp instanceof Error) {
          return res.status(500).send({ error: mapError(loginResp).message })
        }

        const cookies = setCookie.parse(loginResp.cookiesToSendBackToClient)
        const csrfCookie = cookies?.find((c) => c.name.includes("csrf"))
        const kratosSessionCookie = cookies?.find((c) =>
          c.name.includes("ory_kratos_session"),
        )
        if (!csrfCookie || !kratosSessionCookie) {
          return res
            .status(500)
            .send({ error: "Missing csrf or ory_kratos_session cookie" })
        }

        res.cookie(kratosSessionCookie.name, kratosSessionCookie.value, {
          maxAge: kratosSessionCookie.maxAge,
          sameSite: "lax",
          secure: kratosSessionCookie.secure,
          httpOnly: kratosSessionCookie.httpOnly,
          path: kratosSessionCookie.path,
          expires: kratosSessionCookie.expires,
        })

        res.cookie(csrfCookie.name, csrfCookie.value, {
          maxAge: csrfCookie.maxAge,
          sameSite: "lax",
          secure: csrfCookie.secure,
          httpOnly: csrfCookie.httpOnly,
          path: csrfCookie.path,
          expires: csrfCookie.expires,
        })

        res.send({
          identity: {
            id: loginResp.kratosUserId,
            uid: loginResp.kratosUserId,
            phoneNumber: phone,
          },
        })
      } catch (e) {
        addAttributesToCurrentSpan({ cookieLoginError: e })
        res.status(500).send({ result: "Error logging in" })
      }
    },
  }),
)

// Logout flow
// 1. Client app (web wallet/admin etc...) sends an HTTP GET
//    to http://localhost:4002/auth/logout with credentials: 'include'
// 2. The backend project logs the user out via kratos and
//    revokes the session via kratosAdmin
// 3. All the cookies are deleted via res.clearCookie
//    from the backend
// 4. The cookies should be magically deleted on the client
authRouter.get(
  "/logout",
  wrapAsyncToRunInSpan({
    namespace: "auth-router",
    fn: async (req: express.Request, res: express.Response) => {
      try {
        let reqCookie = req.headers.cookie
        if (!reqCookie) {
          return res
            .status(500)
            .send({ error: "Missing csrf or ory_kratos_session cookie" })
        }
        reqCookie = decodeURIComponent(reqCookie)
        const logoutResp = await logoutCookie(reqCookie as KratosCookie)
        if (logoutResp instanceof Error)
          res.status(500).send({ error: logoutResp.message })
        // manually clear all cookies for the client
        for (const cookieName of Object.keys(req.cookies)) {
          res.clearCookie(cookieName)
        }
        res.status(200).send({
          result: "logout successful",
        })
      } catch (e) {
        addAttributesToCurrentSpan({ cookieLogoutError: e })
        res.status(500).send({ error: "Error Logging out" })
      }
    },
  }),
)

// Helper endpoint to clear any lingering cookies like csrf
authRouter.get("/clearCookies", async (req, res) => {
  try {
    if (req.cookies) {
      for (const cookieName of Object.keys(req.cookies)) {
        res.clearCookie(cookieName)
      }
      res.status(200).send({
        result: "cookies cleared successfully",
      })
    }
  } catch (e) {
    res.status(500).send({ result: "Error clearing cookies" })
  }
})

export default authRouter
