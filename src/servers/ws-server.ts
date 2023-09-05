import { getOperationAST, GraphQLError, parse, validate } from "graphql"

import { WebSocketServer } from "ws"
import { gqlMainSchema } from "@graphql/public"
import { Extra, useServer } from "graphql-ws/lib/use/ws"

import { getJwksArgs, UNSECURE_IP_FROM_REQUEST_OBJECT, WEBSOCKET_PORT } from "@config"
import { Context } from "graphql-ws"
import jsonwebtoken from "jsonwebtoken"

import { parseIps } from "@domain/accounts-ips"
import { ErrorLevel } from "@domain/shared"

import jwksRsa from "jwks-rsa"

import { validateKratosCookie } from "@services/kratos"
import { baseLogger } from "@services/logger"
import { setupMongoConnection } from "@services/mongodb"
import { sendOathkeeperRequestGraphql } from "@services/oathkeeper"
import {
  addAttributesToCurrentSpan,
  addEventToCurrentSpan,
  recordExceptionInCurrentSpan,
  wrapAsyncToRunInSpan,
} from "@services/tracing"

import cookie from "cookie"

import { sessionPublicContext } from "./middlewares/session"

const schema = gqlMainSchema

const port = WEBSOCKET_PORT
const path = "/graphql"

const wsServer = new WebSocketServer({
  port,
  path,
})

// Enable CORS
wsServer.on("headers", (headers, request) => {
  const origin = request.headers.origin ?? request.headers.host ?? "*"
  headers.push(`Access-Control-Allow-Origin: ${origin}`)
  headers.push("Access-Control-Allow-Credentials: true")
})

const jwtAlgorithms: jsonwebtoken.Algorithm[] = ["RS256"]

const authorizedContexts: Record<string, unknown> = {}

const getContext = async (
  ctx: Context<
    Record<string, unknown> | undefined,
    Extra & Partial<Record<PropertyKey, never>>
  >,
) => {
  return wrapAsyncToRunInSpan({
    namespace: "ws-server",
    fnName: "getContext",
    fn: async () => {
      const connectionParams = ctx.connectionParams

      // TODO: check if nginx pass the ip to the header
      // TODO: ip not been used currently for subscription.
      // implement some rate limiting.
      const ipString = UNSECURE_IP_FROM_REQUEST_OBJECT
        ? connectionParams?.ip ?? ctx.extra?.request?.socket?.remoteAddress
        : connectionParams?.["x-real-ip"] || connectionParams?.["x-forwarded-for"]

      const ip = parseIps(ipString)

      const authz = connectionParams?.Authorization as string | undefined

      const cookies = ctx.extra?.request?.headers?.cookie ?? undefined
      addAttributesToCurrentSpan({ "ws.hasCookies": cookies ? true : false })
      if (cookies?.includes("ory_kratos_session")) {
        addAttributesToCurrentSpan({ "ws.hasKratosCookies": true })
        const kratosCookieRes = await validateKratosCookie(cookies)
        if (kratosCookieRes instanceof Error) return kratosCookieRes
        const tokenPayload = {
          sub: kratosCookieRes.kratosUserId,
        }

        return sessionPublicContext({
          tokenPayload,
          ip,
        })
      }

      const kratosToken = authz?.slice(7) as AuthToken

      // make request to oathkeeper
      // if the kratosToken is undefined, then oathkeeper will create a subject with "anon"
      const jwtToken = await sendOathkeeperRequestGraphql(kratosToken)
      // TODO: see how returning an error affect the websocket connection
      if (jwtToken instanceof Error) return jwtToken

      const keyJwks = await jwksRsa(getJwksArgs()).getSigningKey()

      const tokenPayload = jsonwebtoken.verify(jwtToken, keyJwks.getPublicKey(), {
        algorithms: jwtAlgorithms,
      })

      if (typeof tokenPayload === "string") {
        return false
      }

      return sessionPublicContext({
        tokenPayload,
        ip,
      })
    },
  })()
}

const server = () =>
  wrapAsyncToRunInSpan({
    namespace: "ws-server",
    fnName: "useServer",
    fn: async () => {
      useServer(
        {
          onSubscribe: (_ctx, msg) => {
            baseLogger.debug("Subscribe", { _ctx, msg })
            addEventToCurrentSpan("Websocket subscribed")
            addAttributesToCurrentSpan({ "ws.subscribed": "true" })

            // construct the execution arguments
            const args = {
              schema,
              operationName: msg.payload.operationName,
              document: parse(msg.payload.query),
              variableValues: msg.payload.variables,
            }

            const operationAST = getOperationAST(args.document, args.operationName)
            if (!operationAST) {
              // returning `GraphQLError[]` sends an `ErrorMessage` and stops the subscription
              recordExceptionInCurrentSpan({
                error: new GraphQLError("Unable to identify operation"),
                level: ErrorLevel.Warn,
              })
              return [new GraphQLError("Unable to identify operation")]
            }

            // decline mutation and query requests
            if (operationAST.operation !== "subscription") {
              // returning `GraphQLError[]` sends an `ErrorMessage` and stops the subscription
              recordExceptionInCurrentSpan({
                error: new GraphQLError("Only subscription operations are supported"),
                level: ErrorLevel.Warn,
              })
              return [new GraphQLError("Only subscription operations are supported")]

              // or if you want to be strict and terminate the connection on illegal operations
              // throw new Error("Only subscription operations are supported")
            }

            // dont forget to validate
            const errors = validate(args.schema, args.document)
            if (errors.length > 0) {
              // returning `GraphQLError[]` sends an `ErrorMessage` and stops the subscription
              recordExceptionInCurrentSpan({
                error: errors,
                level: ErrorLevel.Warn,
              })
              return errors
            }

            // ready execution arguments
            return args
          },
          onConnect: async (ctx) => {
            baseLogger.debug("Connect", ctx)
            addEventToCurrentSpan("Websocket connected")
            addAttributesToCurrentSpan({ "ws.connected": "true" })

            const cookies = cookie.parse(ctx.extra.request.headers.cookie || "")
            const hasCookies = typeof cookies !== "string" ? true : false
            addAttributesToCurrentSpan({ "ws.hasCookies": hasCookies })
            const kratosSessionCookie = hasCookies
              ? cookies?.ory_kratos_session
              : undefined

            if (
              typeof ctx.connectionParams?.Authorization !== "string" &&
              !kratosSessionCookie
            ) {
              return true // anon connection ?
            }

            const context = await getContext(ctx)
            if (typeof ctx.connectionParams?.Authorization === "string") {
              authorizedContexts[ctx.connectionParams.Authorization] = context
            }
            if (kratosSessionCookie) {
              authorizedContexts[kratosSessionCookie] = context
            }

            return true
          },
          context: async (ctx) => {
            const cookies = cookie.parse(ctx.extra.request.headers.cookie || "")
            const hasCookies = typeof cookies !== "string" ? true : false
            const kratosSessionCookie = hasCookies
              ? cookies?.ory_kratos_session
              : undefined
            // cookie auth
            if (kratosSessionCookie) {
              addAttributesToCurrentSpan({ "ws.authType": "cookie" })
              return authorizedContexts[kratosSessionCookie]
            }
            // bearer auth
            if (typeof ctx.connectionParams?.Authorization === "string") {
              addAttributesToCurrentSpan({ "ws.authType": "bearer" })
              return authorizedContexts[ctx.connectionParams?.Authorization]
            }
            // anon context
            addAttributesToCurrentSpan({ "ws.authType": "anon" })
            const context = await getContext(ctx)
            return context
          },
          onNext: (ctx, msg, args, result) => {
            baseLogger.debug("Next", { ctx, msg, args, result })
            addEventToCurrentSpan("Websocket next")
            addAttributesToCurrentSpan({ "ws.next": "true" })
          },
          onError: (ctx, msg, errors) => {
            recordExceptionInCurrentSpan({
              error: errors,
              level: ErrorLevel.Warn,
            })
            baseLogger.debug("Error", { ctx, msg, errors })
            addEventToCurrentSpan("Websocket error")
            addAttributesToCurrentSpan({ "ws.error": "true" })
          },
          onComplete: (ctx, msg) => {
            baseLogger.debug("Complete", { ctx, msg })
            addEventToCurrentSpan("Websocket completed")
            addAttributesToCurrentSpan({ "ws.completed": "true" })
          },
        },
        wsServer,
      )
    },
  })()

if (require.main === module) {
  setupMongoConnection()
    .then(async () => {
      // TODO: handle disposition on SIGTERM
      server()
      console.log(`🚀 websocket server ready at http://localhost:${port}${path}`)
    })
    .catch((err) => baseLogger.error(err, "ws server error"))
}
