import { getOperationAST, GraphQLError, parse, validate } from "graphql"
import { WebSocketServer } from "ws" // yarn add ws
// import ws from 'ws'; yarn add ws@7
// const WebSocketServer = ws.Server;
import { gqlMainSchema } from "@graphql/main"
import { useServer } from "graphql-ws/lib/use/ws"

import { getJwksArgs, isDev } from "@config"
import { Context } from "graphql-ws"
import jsonwebtoken from "jsonwebtoken"

import { parseIps } from "@domain/accounts-ips"

import jwksRsa from "jwks-rsa"

import { sendOathkeeperRequest } from "@services/oathkeeper"

import { setupMongoConnection } from "@services/mongodb"

import { baseLogger } from "@services/logger"

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
const getContext = async (ctx: Context) => {
  const connectionParams = ctx.connectionParams

  // TODO: check if nginx pass the ip to the header
  // TODO: ip not been used currently for subscription.
  // implement some rate limiting.
  const ipString = isDev
    ? connectionParams?.ip
    : connectionParams?.["x-real-ip"] || connectionParams?.["x-forwarded-for"]

  const ip = parseIps(ipString)

  const authz = connectionParams?.Authorization as string | undefined

  // TODO: also manage the case where there is a cookie in the request
  // https://www.ory.sh/docs/oathkeeper/guides/proxy-websockets#configure-ory-oathkeeper-and-ory-kratos
  // const cookies = request.headers.cookie
  // if (cookies?.includes("ory_kratos_session")) {
  //   const kratosCookieRes = await validateKratosCookie(cookies)
  //   if (kratosCookieRes instanceof Error) return kratosCookieRes
  //   const tokenPayload = {
  //     sub: kratosCookieRes.kratosUserId,
  //   }
  //   return sessionContext({
  //     tokenPayload,
  //     ip: request?.socket?.remoteAddress,
  //     body: null,
  //   })
  // }

  const kratosToken = authz?.slice(7) as SessionToken

  // make request to oathkeeper
  // if the kratosToken is undefined, then oathkeeper will create a subject with "anon"
  const jwtToken = await sendOathkeeperRequest(kratosToken)
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
          // return [new GraphQLError("Only subscription operations are supported")]

          // or if you want to be strict and terminate the connection on illegal operations
          throw new Error("Only subscription operations are supported")
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

        // TODO: integrate open telemetry
        if (typeof ctx.connectionParams?.Authorization !== "string") {
          return true // anon connection ?
        }

        const context = await getContext(ctx)
        authorizedContexts[ctx.connectionParams.Authorization] = context
        return true
      },
      context: (ctx) => {
        // TODO: integrate open telemetry
        if (typeof ctx.connectionParams?.Authorization === "string") {
          return authorizedContexts[ctx.connectionParams?.Authorization]
        }
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
    })
    .catch((err) => baseLogger.error(err, "ws server error"))
}

console.log(`🚀 websocket server ready at http://localhost:${port}${path}`)
