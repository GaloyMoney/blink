import { createServer } from "http"

import express, { NextFunction, Request, Response } from "express"

import { UNSECURE_IP_FROM_REQUEST_OBJECT, getJwksArgs } from "@config"
import { baseLogger } from "@services/logger"
import {
  ACCOUNT_USERNAME,
  SemanticAttributes,
  addAttributesToCurrentSpanAndPropagate,
} from "@services/tracing"
import { ApolloServerPluginDrainHttpServer } from "apollo-server-core"
import { ApolloError, ApolloServer } from "apollo-server-express"
import { GetVerificationKey, expressjwt } from "express-jwt"
import { GraphQLError, GraphQLSchema } from "graphql"
import { rule } from "graphql-shield"
import jsonwebtoken from "jsonwebtoken"
import PinoHttp from "pino-http"

import { AuthenticationError, AuthorizationError } from "@graphql/error"
import { mapError } from "@graphql/error-map"

import { parseIps } from "@domain/accounts-ips"

import { fieldExtensionsEstimator, simpleEstimator } from "graphql-query-complexity"

import { createComplexityPlugin } from "graphql-query-complexity-apollo-plugin"

import jwksRsa from "jwks-rsa"

import { parseUnknownDomainErrorFromUnknown } from "@domain/shared"

import authRouter from "./authorization"
import kratosCallback from "./callback/kratos"
import healthzHandler from "./middlewares/healthz"
import { idempotencyMiddleware } from "./middlewares/idempotency"
import { sessionPublicContext } from "./middlewares/session"

const graphqlLogger = baseLogger.child({
  module: "graphql",
})

export const isAuthenticated = rule({ cache: "contextual" })((
  parent,
  args,
  ctx: GraphQLContext,
) => {
  return !!ctx.domainAccount || new AuthenticationError({ logger: baseLogger })
})

export const isEditor = rule({ cache: "contextual" })((
  parent,
  args,
  ctx: GraphQLContextAuth,
) => {
  return ctx.domainAccount.isEditor
    ? true
    : new AuthorizationError({ logger: baseLogger })
})

const jwtAlgorithms: jsonwebtoken.Algorithm[] = ["RS256"]

type RequestWithGqlContext = Request & { gqlContext: GraphQLContext | undefined }

const setGqlContext = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const tokenPayload = req.token

  const ipString = UNSECURE_IP_FROM_REQUEST_OBJECT
    ? req.ip
    : req.headers["x-real-ip"] || req.headers["x-forwarded-for"]

  const ip = parseIps(ipString)

  const gqlContext = await sessionPublicContext({
    tokenPayload,
    ip,
  })

  const reqWithGqlContext = req as RequestWithGqlContext
  reqWithGqlContext.gqlContext = gqlContext

  addAttributesToCurrentSpanAndPropagate(
    {
      [SemanticAttributes.HTTP_CLIENT_IP]: ip,
      [SemanticAttributes.HTTP_USER_AGENT]: req.headers["user-agent"],
      [ACCOUNT_USERNAME]: gqlContext.domainAccount?.username,
      [SemanticAttributes.ENDUSER_ID]: tokenPayload?.sub,
    },
    next,
  )
}

export const startApolloServer = async ({
  schema,
  port,
  type,
}: {
  schema: GraphQLSchema
  port: string | number
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
        // TODO(telemetry): add complexity value to span
        baseLogger.debug({ complexity }, "queryComplexity")
      },
    }),
    ApolloServerPluginDrainHttpServer({ httpServer }),
  ]

  const apolloServer = new ApolloServer({
    schema,
    cache: "bounded",
    plugins: apolloPlugins,
    context: (context) => {
      return (context.req as RequestWithGqlContext).gqlContext
    },
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
        throw mapError(parseUnknownDomainErrorFromUnknown(err))
      }
    },
  })

  app.use("/auth", authRouter)
  app.use("/kratos", kratosCallback)

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

  const secret = jwksRsa.expressJwtSecret(getJwksArgs()) as GetVerificationKey // https://github.com/auth0/express-jwt/issues/288#issuecomment-1122524366

  app.use(idempotencyMiddleware)

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

  apolloServer.applyMiddleware({
    app,
    path: "/graphql",
    cors: { credentials: true, origin: true },
  })

  return new Promise((resolve, reject) => {
    httpServer.listen({ port }, () => {
      console.log(
        `🚀 "${type}" server ready at http://localhost:${port}${apolloServer.graphqlPath}`,
      )

      console.log(
        `in dev mode, ${type} server should be accessed through oathkeeper reverse proxy at ${
          type === "admin"
            ? "http://localhost:4002/admin/graphql"
            : "http://localhost:4002/graphql"
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
