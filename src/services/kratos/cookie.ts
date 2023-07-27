import libCookie from "cookie"
import setCookie, { Cookie } from "set-cookie-parser"

import { ICookieOptions } from "@domain/authentication/cookie"

import { kratosPublic } from "./private"
import { KratosError } from "./errors"

export const createCookieLoginFlow = async (): Promise<
  | {
      flowId: string
      cookie: string
      csrf: string
    }
  | KratosError
> => {
  const flow = await kratosPublic.createBrowserLoginFlow()
  const parsedCookies = setCookie.parse(flow.headers["set-cookie"])
  const csrfCookie = parsedCookies?.find((c) => c.name.includes("csrf"))
  if (!csrfCookie) return new KratosError("Could not find csrf cookie")
  const cookie = libCookie.serialize(csrfCookie.name, csrfCookie.value, {
    expires: csrfCookie.expires,
    maxAge: csrfCookie.maxAge,
    sameSite: "none",
    secure: csrfCookie.secure,
    httpOnly: csrfCookie.httpOnly,
    path: csrfCookie.path,
  })
  return {
    flowId: flow.data.id,
    cookie: decodeURIComponent(cookie),
    csrf: csrfCookie.value,
  }
}

export const parseKratosCookies = (
  cookie: string | Array<SessionCookie>,
): {
  asString: () => string | SessionCookie[]
  asArray: () => setCookie.Cookie[]
  csrf: () => setCookie.Cookie | undefined
  kratosSession: () => setCookie.Cookie | undefined
  kratosSessionAsString: () => string
  formatCookieOptions: (cookieVal: Cookie) => ICookieOptions
} => {
  let cookiesStr = ""
  if (cookie instanceof Array) {
    for (const cookieVal of cookie) {
      cookiesStr = cookiesStr + cookieVal + "; "
    }
  }
  const cookies: setCookie.Cookie[] = setCookie.parse(cookie)

  return {
    asString: () => {
      if (cookie instanceof String) return cookie
      return cookiesStr
    },
    asArray: (): setCookie.Cookie[] => {
      return cookies
    },
    csrf: () => {
      return cookies?.find((c) => c.name.includes("csrf"))
    },
    kratosSession: () => {
      return cookies?.find((c) => c.name.includes("ory_kratos_session"))
    },
    kratosSessionAsString: () => {
      const kratosSessionCookie = cookies?.find((c) =>
        c.name.includes("ory_kratos_session"),
      )
      if (!kratosSessionCookie) return ""
      return libCookie.serialize(kratosSessionCookie.name, kratosSessionCookie.value, {
        expires: kratosSessionCookie.expires,
        maxAge: kratosSessionCookie.maxAge,
        sameSite: "none",
        secure: kratosSessionCookie.secure,
        httpOnly: kratosSessionCookie.httpOnly,
        path: kratosSessionCookie.path,
      })
    },
    formatCookieOptions: (cookieVal: Cookie) => {
      const thirtyDaysFromNow = new Date(new Date().setDate(new Date().getDate() + 30))
      const expiresAt = cookieVal.expires ? cookieVal.expires : thirtyDaysFromNow
      const maxAge = expiresAt.getTime() - new Date().getTime()
      const cookieOpts: ICookieOptions = {
        maxAge,
        sameSite: "none",
        secure: cookieVal.secure ? Boolean(cookieVal.secure) : true,
        httpOnly: cookieVal.httpOnly ? Boolean(cookieVal.httpOnly) : true,
        path: cookieVal.path ? String(cookieVal.path) : "/",
      }
      return cookieOpts
    },
  }
}
