import { getOperationAST, GraphQLError, parse, validate } from "graphql"

import { WebSocketServer } from "ws" // yarn add ws
import { gqlMainSchema } from "@graphql/main"
import { Extra, useServer } from "graphql-ws/lib/use/ws"

import { getJwksArgs, isProd } from "@config"
import { Context } from "graphql-ws"
import jsonwebtoken from "jsonwebtoken"

import { parseIps } from "@domain/accounts-ips"

import jwksRsa from "jwks-rsa"

import { sendOathkeeperRequestGraphql } from "@services/oathkeeper"
import { validateKratosCookie } from "@services/kratos"
import { setupMongoConnection } from "@services/mongodb"
import { baseLogger } from "@services/logger"

import cookie from "cookie"

import { sessionContext } from "./graphql-server"

const schema = gqlMainSchema

const port = process.env.WEBSOCKET_PORT ? parseInt(process.env.WEBSOCKET_PORT) : 4000
const path = "/graphql"

const wsServer = new WebSocketServer({
  port,
  path,
})

const jwtAlgorithms: jsonwebtoken.Algorithm[] = ["RS256"]

const authorizedContexts: Record<string, unknown> = {}

// new ws server
const getContext = async (
  ctx: Context<
    Record<string, unknown> | undefined,
    Extra & Partial<Record<PropertyKey, never>>
  >,
) => {
  const connectionParams = ctx.connectionParams

  // TODO: check if nginx pass the ip to the header
  // TODO: ip not been used currently for subscription.
  // implement some rate limiting.
  const ipString = isProd
    ? connectionParams?.["x-real-ip"] || connectionParams?.["x-forwarded-for"]
    : connectionParams?.ip ?? ctx.extra?.request?.socket?.remoteAddress ?? undefined

  const ip = parseIps(ipString)

  const authz = connectionParams?.Authorization as string | undefined

  const cookies = ctx.extra?.request?.headers?.cookie ?? undefined
  if (cookies?.includes("ory_kratos_session")) {
    const kratosCookieRes = await validateKratosCookie(cookies)
    if (kratosCookieRes instanceof Error) return kratosCookieRes
    const tokenPayload = {
      sub: kratosCookieRes.kratosUserId,
    }
    return sessionContext({
      tokenPayload,
      ip,
      body: null,
    })
  }

  const kratosToken = authz?.slice(7) as SessionToken

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

  return sessionContext({
    tokenPayload,
    ip,

    // TODO: Resolve what's needed here
    body: null,
  })
}

const server = () =>
  useServer(
    {
      onSubscribe: (_ctx, msg) => {
        baseLogger.debug("Subscribe", { _ctx, msg })

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
          return [new GraphQLError("Unable to identify operation")]
        }

        // handle mutation and query requests
        if (operationAST.operation !== "subscription") {
          // returning `GraphQLError[]` sends an `ErrorMessage` and stops the subscription
          return [new GraphQLError("Only subscription operations are supported")]

          // or if you want to be strict and terminate the connection on illegal operations
          // throw new Error("Only subscription operations are supported")
        }

        // dont forget to validate
        const errors = validate(args.schema, args.document)
        if (errors.length > 0) {
          // returning `GraphQLError[]` sends an `ErrorMessage` and stops the subscription
          return errors
        }

        // ready execution arguments
        return args
      },
      onConnect: async (ctx) => {
        baseLogger.debug("Connect", ctx)

        const cookies = cookie.parse(ctx.extra.request.headers.cookie || "")
        const kratosSessionCookie = cookies.ory_kratos_session

        // TODO: integrate open telemetry
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
        // TODO: integrate open telemetry
        const cookies = cookie.parse(ctx.extra.request.headers.cookie || "")
        const kratosSessionCookie = cookies.ory_kratos_session
        // cookie auth
        if (kratosSessionCookie) {
          return authorizedContexts[kratosSessionCookie]
        }
        // bearer auth
        if (typeof ctx.connectionParams?.Authorization === "string") {
          return authorizedContexts[ctx.connectionParams?.Authorization]
        }
        // anon context
        const context = await getContext(ctx)
        return context
      },
      onNext: (ctx, msg, args, result) => {
        baseLogger.debug("Next", { ctx, msg, args, result })
      },
      onError: (ctx, msg, errors) => {
        baseLogger.debug("Error", { ctx, msg, errors })
      },
      onComplete: (ctx, msg) => {
        baseLogger.debug("Complete", { ctx, msg })
      },
    },
    wsServer,
  )

if (require.main === module) {
  setupMongoConnection()
    .then(async () => {
      // TODO: handle disposition on SIGTERM
      server()
      console.log(`🚀 websocket server ready at http://localhost:${port}${path}`)
    })
    .catch((err) => baseLogger.error(err, "ws server error"))
}
