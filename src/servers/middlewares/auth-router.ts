import cors from "cors"
import express from "express"

import * as jwt from "jsonwebtoken"

import { Auth } from "@app"
import { getKratosConfig, isDev, JWT_SECRET } from "@config"

import { mapError } from "@graphql/error-map"
import { addAttributesToCurrentSpan, wrapAsyncToRunInSpan } from "@services/tracing"

import { AuthWithPhonePasswordlessService, validateKratosToken } from "@services/kratos"
import { kratosPublic, kratosAdmin } from "@services/kratos/private"
import { AccountsRepository } from "@services/mongoose"
import { parseIps } from "@domain/accounts-ips"
import { KratosError } from "@services/kratos/errors"
import bodyParser from "body-parser"
import { isCodeValid } from "@app/auth"
import setCookie from "set-cookie-parser"
import cookieParser from "cookie-parser"

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

authRouter.post("/login", async (req, res) => {
  const phoneNumber = req.body.phoneNumber as PhoneNumber
  const authCode = req.body.authCode

  const validCode = await isCodeValid({ phone: phoneNumber, code: authCode })
  if (validCode instanceof Error) {
    // TODO loop and clear cookies to prevent error on client
    return res.status(500).send(JSON.stringify(validCode))
  }

  const authService = AuthWithPhonePasswordlessService()
  const loginRes = await authService.loginCookie(phoneNumber)
  if (loginRes instanceof Error) {
    // TODO loop and clear cookies to prevent error on client
    return res.status(500).send(JSON.stringify(loginRes))
  }

  const cookies = setCookie.parse(loginRes.cookieToSendBackToClient)
  const csrfCookie = cookies?.find((c) => c.name.includes("csrf"))
  const kratosSessionCookie = cookies?.find((c) => c.name.includes("ory_kratos_session"))
  if (!csrfCookie || !kratosSessionCookie) {
    return res
      .status(500)
      .send(JSON.stringify({ result: "No csrfCookie or kratosSessionCookie " }))
  }

  res.cookie(kratosSessionCookie.name, kratosSessionCookie.value, {
    maxAge: kratosSessionCookie.maxAge,
    sameSite: kratosSessionCookie.sameSite,
    secure: kratosSessionCookie.secure,
    httpOnly: kratosSessionCookie.httpOnly,
    path: kratosSessionCookie.Path,
    expires: kratosSessionCookie.expires,
  })

  res.cookie(csrfCookie.name, csrfCookie.value, {
    maxAge: csrfCookie.maxAge,
    sameSite: csrfCookie.sameSite,
    secure: csrfCookie.secure,
    httpOnly: csrfCookie.httpOnly,
    path: csrfCookie.Path,
    expires: csrfCookie.expires,
  })

  if (isDev) {
    res.set({
      "access-control-allow-credentials": "true",
      "access-control-allow-methods": "PUT GET HEAD POST DELETE OPTIONS",
      "access-control-allow-origin": "http://localhost:3000",
    })
  }

  res.send({
    identity: {
      id: loginRes.kratosUserId,
      uid: loginRes.kratosUserId,
      phoneNumber,
    },
  })
})

// Logout flow
// 1. Client app (web wallet/admin etc...) sends an HTTP GET
//    to http://localhost:4002/auth/logout with credentials: 'include'
// 2. The backend project logs the user out via kratos and
//    revokes the session via kratosAdmin
// 3. All the cookies are deleted via res.clearCookie
//    from the backend
// 4. The cookies should be magically deleted on the client
authRouter.get("/logout", async (req, res) => {
  try {
    let reqCookie = req.headers.cookie
    if (!reqCookie) {
      return res
        .status(500)
        .send(JSON.stringify({ result: "need cookies and redirect query params" }))
    }
    reqCookie = decodeURIComponent(reqCookie)
    const session = await kratosPublic.toSession({ cookie: reqCookie })
    const sessionId = session.data.id
    // * revoke token via admin api
    //   there is no way to do it via cookies and the public api via the backend
    //   I tried the kratosPublic.createBrowserLogoutFlow but it did not work
    //   properly with cookies
    const sessionResp = await kratosAdmin.disableSession({
      id: sessionId,
    })
    // TODO check for 204 resp
    // manually clear all cookies on the client
    for (const cookieName of Object.keys(req.cookies)) {
      res.clearCookie(cookieName)
    }
    if (isDev) {
      res.set({
        "access-control-allow-credentials": "true",
        "access-control-allow-methods": "PUT GET HEAD POST DELETE OPTIONS",
        "access-control-allow-origin": "http://localhost:3000",
      })
    }
    res.status(200).send(
      JSON.stringify({
        result: "logout successful",
      }),
    )
  } catch (e) {
    res.status(500).send(JSON.stringify({ result: `${e}` }))
  }
})

export default authRouter
