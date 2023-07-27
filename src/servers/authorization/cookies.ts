import cors from "cors"
import express from "express"

import { Auth } from "@app"
import { isProd } from "@config"

import { mapError } from "@graphql/error-map"
import { recordExceptionInCurrentSpan, wrapAsyncToRunInSpan } from "@services/tracing"

import { logoutCookie } from "@app/authentication"
import { parseIps } from "@domain/accounts-ips"
import { checkedToPhoneNumber } from "@domain/users"
import bodyParser from "body-parser"

import cookieParser from "cookie-parser"

import { validateKratosCookie } from "@services/kratos"

import { parseKratosCookies } from "@services/kratos/cookie"

import { authRouter } from "./router"

// FIXME: those directive should only apply if you select a cookie-related route

authRouter.use(cors({ origin: true, credentials: true }))
authRouter.use(bodyParser.urlencoded({ extended: true }))
authRouter.use(bodyParser.json())
authRouter.use(cookieParser())

authRouter.post(
  "/login",
  wrapAsyncToRunInSpan({
    namespace: "servers.middlewares.authRouter",
    fnName: "login",
    fn: async (req: express.Request, res: express.Response) => {
      const ipString = isProd ? req?.headers["x-real-ip"] : req?.ip
      const ip = parseIps(ipString)
      if (!ip) {
        recordExceptionInCurrentSpan({ error: "IP is not defined" })
        return res.status(500).send({ error: "IP is not defined" })
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

      try {
        const kratosCookies = parseKratosCookies(loginResp.cookiesToSendBackToClient)
        const kratosUserId: UserId | undefined = loginResp.kratosUserId
        const csrfCookie = kratosCookies.csrf()
        const kratosSessionCookie = kratosCookies.kratosSession()
        if (!csrfCookie || !kratosSessionCookie) {
          return res
            .status(500)
            .send({ error: "Missing csrf or ory_kratos_session cookie" })
        }
        const kratosCookieStr = kratosCookies.kratosSessionAsString()
        const result = await validateKratosCookie(kratosCookieStr)
        if (result instanceof Error) {
          return res.status(500).send({ error: result.message })
        }
        res.cookie(
          kratosSessionCookie.name,
          kratosSessionCookie.value,
          kratosCookies.formatCookieOptions(kratosSessionCookie),
        )
        res.cookie(
          csrfCookie.name,
          csrfCookie.value,
          kratosCookies.formatCookieOptions(csrfCookie),
        )
        return res.send({
          identity: {
            id: kratosUserId,
            uid: kratosUserId,
            phoneNumber: phone,
          },
        })
      } catch (error) {
        recordExceptionInCurrentSpan({ error })
        return res.status(500).send({ result: "Error parsing cookies" })
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
    namespace: "servers.middlewares.authRouter",
    fnName: "logout",
    fn: async (req: express.Request, res: express.Response) => {
      let reqCookie = req.headers?.cookie
      if (!reqCookie) {
        return res
          .status(500)
          .send({ error: "Missing csrf or ory_kratos_session cookie" })
      }
      try {
        reqCookie = decodeURIComponent(reqCookie)
        const logoutResp = await logoutCookie(reqCookie as SessionCookie)
        if (logoutResp instanceof Error)
          return res.status(500).send({ error: logoutResp.message })
        // manually clear all cookies for the client
        for (const cookieName of Object.keys(req.cookies)) {
          res.clearCookie(cookieName)
        }
        return res.status(200).send({
          result: "logout successful",
        })
      } catch (error) {
        recordExceptionInCurrentSpan({ error })
        return res.status(500).send({ error: "Error logging out" })
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
      return res.status(200).send({
        result: "Cookies cleared successfully",
      })
    }
  } catch (err) {
    return res.status(500).send({ result: "Error clearing cookies" })
  }
})

export default {}
