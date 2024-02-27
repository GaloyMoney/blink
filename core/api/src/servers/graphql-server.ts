import { createServer } from "http"

import { ApolloServer, ApolloServerPlugin } from "@apollo/server"
import { unwrapResolverError } from "@apollo/server/errors"
import { expressMiddleware } from "@apollo/server/express4"
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer"
import cors from "cors"
import express, { NextFunction, Request, Response } from "express"
import { GetVerificationKey, expressjwt } from "express-jwt"
import { GraphQLError, GraphQLSchema, separateOperations } from "graphql"
import {
  ComplexityEstimator,
  fieldExtensionsEstimator,
  getComplexity,
  simpleEstimator,
} from "graphql-query-complexity"
import jsonwebtoken from "jsonwebtoken"
import jwksRsa from "jwks-rsa"
import PinoHttp from "pino-http"

import authRouter from "./authentication"
import healthzHandler from "./middlewares/healthz"
import { idempotencyMiddleware } from "./middlewares/idempotency"

import { getJwksArgs } from "@/config"
import { DomainError, parseUnknownDomainErrorFromUnknown } from "@/domain/shared"
import { mapError } from "@/graphql/error-map"
import { baseLogger } from "@/services/logger"

const graphqlLogger = baseLogger.child({
  module: "graphql",
})

const jwtAlgorithms: jsonwebtoken.Algorithm[] = ["RS256"]

export const startApolloServer = async ({
  schema,
  port,
  type,
  setGqlContext,
}: {
  schema: GraphQLSchema
  port: string | number
  type: string
  setGqlContext: (req: Request, res: Response, next: NextFunction) => Promise<void>
}): Promise<Record<string, unknown>> => {
  const app = express()
  const httpServer = createServer(app)

  const apolloPlugins = [
    ApolloServerPluginGraphQLQueryComplexity({
      schema,
      estimators: [fieldExtensionsEstimator(), simpleEstimator({ defaultComplexity: 1 })],
      maximumComplexity: 200,
      onComplete: (complexity) => {
        // TODO(telemetry): add complexity value to span
        baseLogger.debug({ complexity }, "queryComplexity")
      },
    }),
    ApolloServerPluginDrainHttpServer({ httpServer }),
  ]

  const apolloServer = new ApolloServer<GraphQLContext>({
    schema,
    cache: "bounded",
    plugins: apolloPlugins,
    formatError: (formattedError, error) => {
      try {
        if (unwrapResolverError(error) instanceof DomainError) {
          return mapError(parseUnknownDomainErrorFromUnknown(error))
        }

        return {
          message: formattedError.message,
          locations: formattedError.locations,
          path: formattedError.path,
          code: formattedError.extensions?.code,
        }
      } catch (err) {
        throw parseUnknownDomainErrorFromUnknown(err)
      }
    },
  })

  app.use("/auth", authRouter)

  // Health check
  app.get(
    "/healthz",
    healthzHandler({
      checkDbConnectionStatus: true,
      checkRedisStatus: true,
      checkLndsStatus: false,
      checkBriaStatus: false,
    }),
  )

  app.use(
    PinoHttp({
      logger: graphqlLogger,
      wrapSerializers: true,
      customProps: (req) => {
        /* eslint @typescript-eslint/ban-ts-comment: "off" */
        // @ts-ignore-next-line no-implicit-any error
        const account = req["gqlContext"]?.domainAccount
        return {
          // @ts-ignore-next-line no-implicit-any error
          "body": req["body"],
          // @ts-ignore-next-line no-implicit-any error
          "token.sub": req["token"]?.sub,
          // @ts-ignore-next-line no-implicit-any error
          "gqlContext.user": req["gqlContext"]?.user,
          // @ts-ignore-next-line no-implicit-any error
          "gqlContext.domainAccount:": {
            id: account?.id,
            createdAt: account?.createdAt,
            defaultWalletId: account?.defaultWalletId,
            level: account?.level,
            status: account?.status,
            displayCurrency: account?.displayCurrency,
          },
        }
      },
      autoLogging: {
        ignore: (req) => req.url === "/healthz",
      },
      serializers: {
        res: (res) => ({ statusCode: res.statusCode }),
        req: (req) => ({
          id: req.id,
          method: req.method,
          url: req.url,
          remoteAddress: req.remoteAddress,
          // headers: req.headers,
        }),
      },
    }),
  )

  app.use(idempotencyMiddleware) // TODO: only needed for public endpoint

  const secret = jwksRsa.expressJwtSecret(getJwksArgs()) as GetVerificationKey // https://github.com/auth0/express-jwt/issues/288#issuecomment-1122524366

  app.use(
    "/graphql",
    expressjwt({
      secret,
      algorithms: jwtAlgorithms,
      credentialsRequired: true,
      requestProperty: "token",
      issuer: "galoy.io",
    }),
  )

  app.use("/graphql", setGqlContext)

  await apolloServer.start()

  app.use(
    "/graphql",
    cors<cors.CorsRequest>({ credentials: true, origin: true }),
    express.json(),
    expressMiddleware(apolloServer, {
      context: async ({ req }) => req.gqlContext,
    }),
  )

  return new Promise((resolve, reject) => {
    httpServer.listen({ port }, () => {
      console.log(`🚀 "${type}" server ready at http://localhost:${port}/graphql`)

      console.log(
        `in dev mode, ${type} server should be accessed through oathkeeper reverse proxy at ${
          type === "admin"
            ? "http://localhost:4455/admin/graphql"
            : "http://localhost:4455/graphql"
        }`,
      )

      resolve({ app, httpServer, apolloServer })
    })

    httpServer.on("error", (err) => {
      console.error(err)
      reject(err)
    })
  })
}

const ApolloServerPluginGraphQLQueryComplexity = ({
  schema,
  maximumComplexity,
  estimators,
  onComplete,
  createError = (max, actual) =>
    new GraphQLError(`Query too complex. Value of ${actual} is over the maximum ${max}.`),
}: {
  schema: GraphQLSchema
  maximumComplexity: number
  estimators: Array<ComplexityEstimator>
  onComplete?: (complexity: number) => Promise<void> | void
  createError?: (max: number, actual: number) => Promise<GraphQLError> | GraphQLError
}): ApolloServerPlugin => {
  return {
    async requestDidStart() {
      return {
        async didResolveOperation({ request, document }) {
          const query = request.operationName
            ? separateOperations(document)[request.operationName]
            : document

          const complexity = getComplexity({
            schema,
            query,
            variables: request.variables,
            estimators,
          })

          if (complexity >= maximumComplexity) {
            throw await createError(maximumComplexity, complexity)
          }

          if (onComplete) {
            await onComplete(complexity)
          }
        },
      }
    },
  }
}
