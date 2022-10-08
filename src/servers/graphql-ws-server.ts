import { createServer } from "http"

import { GALOY_WS_PORT, getApolloConfig, getJwksArgs, isDev, isProd } from "@config"
import { baseLogger } from "@services/logger"
import {
  ApolloServerPluginDrainHttpServer,
  ApolloServerPluginLandingPageDisabled,
  ApolloServerPluginLandingPageGraphQLPlayground,
  ApolloServerPluginUsageReporting,
} from "apollo-server-core"
import { ApolloError, ApolloServer } from "apollo-server-express"
import express from "express"
import { getOperationAST, GraphQLError, GraphQLSchema, parse, validate } from "graphql"
import { useServer } from "graphql-ws/lib/use/ws"
import helmet from "helmet"
import jsonwebtoken from "jsonwebtoken"
import PinoHttp from "pino-http"
import { WebSocketServer } from "ws"

import { mapError } from "@graphql/error-map"

import { parseIps } from "@domain/users-ips"

import { fieldExtensionsEstimator, simpleEstimator } from "graphql-query-complexity"

import { createComplexityPlugin } from "graphql-query-complexity-apollo-plugin"

import jwksRsa from "jwks-rsa"

import { sendOathkeeperRequest } from "@services/oathkeeper"

import dotenv from "dotenv"

import { activateLndHealthCheck } from "@services/lnd/health"
import { setupMongoConnection } from "@services/mongodb"

import { playgroundTabs } from "../graphql/playground"

import { gqlSubscriptionSchema } from "../graphql"

import healthzHandler from "./middlewares/healthz"
import { sessionContext } from "./utils"

dotenv.config()

const graphqlLogger = baseLogger.child({
  module: "graphql",
})

const apolloConfig = getApolloConfig()

const GRAPHQL_PATH = "/graphql"

const jwtAlgorithms: jsonwebtoken.Algorithm[] = ["RS256"]

export const startApolloWsServer = async ({
  schema,
  port,
  enableApolloUsageReporting = false,
  type,
}: {
  schema: GraphQLSchema
  port: string | number
  enableApolloUsageReporting?: boolean
  type: string
}): Promise<Record<string, unknown>> => {
  const app = express()
  const httpServer = createServer(app)

  const apolloPlugins = [
    createComplexityPlugin({
      schema,
      estimators: [fieldExtensionsEstimator(), simpleEstimator({ defaultComplexity: 1 })],
      maximumComplexity: 200,
      onComplete: (complexity) => {
        baseLogger.debug({ complexity }, "queryComplexity")
      },
    }),
    ApolloServerPluginDrainHttpServer({ httpServer }),
    apolloConfig.playground
      ? ApolloServerPluginLandingPageGraphQLPlayground({
          settings: { "schema.polling.enable": false },
          tabs: [
            {
              endpoint: apolloConfig.playgroundUrl,
              ...playgroundTabs.default,
            },
          ],
        })
      : ApolloServerPluginLandingPageDisabled(),
  ]

  if (isProd && enableApolloUsageReporting) {
    apolloPlugins.push(
      ApolloServerPluginUsageReporting({
        rewriteError(err) {
          graphqlLogger.error(err, "Error caught in rewriteError")
          return err
        },
      }),
    )
  }

  const wsServer = new WebSocketServer({
    server: httpServer,
    path: GRAPHQL_PATH,
  })

  const serverCleanup = useServer(
    {
      onSubscribe: (_ctx, msg) => {
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
      schema,
      // onConnect: // TODO: if token is present, but jwt.verify fails, close connection
      context: async (ctx) => {
        const connectionParams = ctx.connectionParams as Record<string, string>

        // TODO: check if nginx pass the ip to the header
        // TODO: ip not been used currently for subscription.
        // implement some rate limiting.
        const ipString = isDev
          ? connectionParams?.ip
          : connectionParams?.["x-real-ip"] || connectionParams?.["x-forwarded-for"]

        const ip = parseIps(ipString)

        const authz = (connectionParams.authorization ||
          connectionParams.Authorization) as string | undefined
        // TODO: also manage the case where there is a cookie in the request

        // make request to oathkeeper
        const originalToken = authz?.slice(7) ?? undefined

        const newToken = await sendOathkeeperRequest(originalToken)
        // TODO: see how returning an error affect the websocket connection
        if (newToken instanceof Error) return newToken

        const keyJwks = await jwksRsa(getJwksArgs()).getSigningKey()

        const tokenPayload = jsonwebtoken.verify(newToken, keyJwks.getPublicKey(), {
          algorithms: jwtAlgorithms,
        })

        if (typeof tokenPayload === "string") {
          throw new Error("tokenPayload should be an object")
        }

        return sessionContext({
          tokenPayload,
          ip,

          // TODO: Resolve what's needed here
          body: null,
        })
      },
    },
    wsServer,
  )

  ;["SIGINT", "SIGTERM"].forEach((signal) => {
    process.on(signal, () => wsServer.close())
  })

  apolloPlugins.push({
    async serverWillStart() {
      return {
        async drainServer() {
          await serverCleanup.dispose()
        },
      }
    },
  })

  const apolloServer = new ApolloServer({
    schema,
    cache: "bounded",
    introspection: apolloConfig.playground,
    plugins: apolloPlugins,
    formatError: (err) => {
      try {
        const reportErrorToClient =
          err instanceof ApolloError || err instanceof GraphQLError

        const reportedError = {
          message: err.message,
          locations: err.locations,
          path: err.path,
          code: err.extensions?.code,
        }

        return reportErrorToClient
          ? reportedError
          : { message: `Error processing GraphQL request ${reportedError.code}` }
      } catch (err) {
        throw mapError(err)
      }
    },
  })

  const enablePolicy = apolloConfig.playground ? false : undefined

  app.use(
    helmet({
      crossOriginEmbedderPolicy: enablePolicy,
      crossOriginOpenerPolicy: enablePolicy,
      crossOriginResourcePolicy: enablePolicy,
      contentSecurityPolicy: enablePolicy,
    }),
  )

  app.use(
    PinoHttp({
      logger: graphqlLogger,
      wrapSerializers: false,
      autoLogging: {
        ignore: (req) => req.url === "/healthz",
      },
    }),
  )

  // Health check
  app.get(
    "/healthz",
    healthzHandler({
      checkDbConnectionStatus: true,
      checkRedisStatus: true,
      checkLndsStatus: false,
    }),
  )

  await apolloServer.start()
  apolloServer.applyMiddleware({ app })

  return new Promise((resolve, reject) => {
    httpServer.listen({ port }, () => {
      console.log(
        `🚀 "${type}" server ready at ws://localhost:${port}${apolloServer.graphqlPath}`,
      )
      resolve({ app, httpServer, apolloServer })
    })

    httpServer.on("error", (err) => {
      console.error(err)
      reject(err)
    })
  })
}

export async function startApolloServerForCoreSchema() {
  return startApolloWsServer({
    schema: gqlSubscriptionSchema,
    port: GALOY_WS_PORT,
    enableApolloUsageReporting: true,
    type: "websocket",
  })
}

if (require.main === module) {
  setupMongoConnection(true)
    .then(async () => {
      activateLndHealthCheck()
      await startApolloServerForCoreSchema()
    })
    .catch((err) => graphqlLogger.error(err, "server error"))
}
