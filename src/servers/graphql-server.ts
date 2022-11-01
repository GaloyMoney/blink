import { createServer } from "http"

import { Accounts, Users } from "@app"
import { getApolloConfig, getGeetestConfig, getJwksArgs, isDev } from "@config"
import Geetest from "@services/geetest"
import { baseLogger } from "@services/logger"
import {
  ACCOUNT_USERNAME,
  addAttributesToCurrentSpan,
  addAttributesToCurrentSpanAndPropagate,
  SemanticAttributes,
} from "@services/tracing"
import {
  ApolloServerPluginDrainHttpServer,
  ApolloServerPluginLandingPageDisabled,
  ApolloServerPluginLandingPageGraphQLPlayground,
} from "apollo-server-core"
import { ApolloError, ApolloServer } from "apollo-server-express"
import express, { NextFunction, Request, Response } from "express"
import { expressjwt, GetVerificationKey } from "express-jwt"
import { execute, GraphQLError, GraphQLSchema, subscribe } from "graphql"
import { rule } from "graphql-shield"
import helmet from "helmet"
import jsonwebtoken from "jsonwebtoken"
import PinoHttp from "pino-http"
import {
  ExecuteFunction,
  SubscribeFunction,
  SubscriptionServer,
} from "subscriptions-transport-ws"

import { AuthenticationError, AuthorizationError } from "@graphql/error"
import { mapError } from "@graphql/error-map"

import { parseIps } from "@domain/users-ips"

import { fieldExtensionsEstimator, simpleEstimator } from "graphql-query-complexity"

import { createComplexityPlugin } from "graphql-query-complexity-apollo-plugin"

import jwksRsa from "jwks-rsa"

import { checkedToKratosUserId } from "@domain/accounts"

import { sendOathkeeperRequest } from "@services/oathkeeper"

import { ValidationError } from "@domain/shared"

import { playgroundTabs } from "../graphql/playground"

import healthzHandler from "./middlewares/healthz"
import authRouter from "./middlewares/auth-router"
import { updateToken } from "./middlewares/update-token"

const graphqlLogger = baseLogger.child({
  module: "graphql",
})

const apolloConfig = getApolloConfig()

export const isAuthenticated = rule({ cache: "contextual" })(
  (parent, args, ctx: GraphQLContext) => {
    return !!ctx.domainAccount || new AuthenticationError({ logger: baseLogger })
  },
)

export const isEditor = rule({ cache: "contextual" })(
  (parent, args, ctx: GraphQLContextForUser) => {
    return ctx.domainAccount.isEditor
      ? true
      : new AuthorizationError({ logger: baseLogger })
  },
)

const jwtAlgorithms: jsonwebtoken.Algorithm[] = ["RS256"]

const geeTestConfig = getGeetestConfig()
const geetest = Geetest(geeTestConfig)

type RequestWithGqlContext = Request & { gqlContext: GraphQLContext | undefined }

const setGqlContext = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const tokenPayload = req.token

  const body = req.body ?? null

  const ipString = isDev
    ? req.ip
    : req.headers["x-real-ip"] || req.headers["x-forwarded-for"]

  const ip = parseIps(ipString)

  const gqlContext = await sessionContext({
    tokenPayload,
    ip,
    body,
  })

  const reqWithGqlContext = req as RequestWithGqlContext
  reqWithGqlContext.gqlContext = gqlContext

  addAttributesToCurrentSpanAndPropagate(
    {
      [SemanticAttributes.HTTP_CLIENT_IP]: ip,
      [ACCOUNT_USERNAME]: gqlContext.domainAccount?.username,
      [SemanticAttributes.ENDUSER_ID]: gqlContext.domainAccount?.id || tokenPayload?.sub,
    },
    next,
  )
}

const sessionContext = ({
  tokenPayload,
  ip,
  body,
}: {
  tokenPayload: jsonwebtoken.JwtPayload
  ip: IpAddress | undefined
  body: unknown
}): Promise<GraphQLContext> => {
  const logger = graphqlLogger.child({ tokenPayload, body })

  let domainUser: User | null = null
  let domainAccount: Account | undefined

  return addAttributesToCurrentSpanAndPropagate(
    {
      "token.sub": tokenPayload?.sub,
      [SemanticAttributes.HTTP_CLIENT_IP]: ip,
    },
    async () => {
      // note: value should match (ie: "anon") if not an accountId
      // settings from dev/ory/oathkeeper.yml/authenticator/anonymous/config/subjet
      const maybeKratosUserId = checkedToKratosUserId(tokenPayload?.sub || "")
      if (!(maybeKratosUserId instanceof ValidationError)) {
        const userId = maybeKratosUserId

        const account = await Accounts.getAccountFromKratosUserId(userId)
        if (account instanceof Error) throw Error
        domainAccount = account

        const loggedInUser = await Users.getUserForLogin({
          userId: account.id as string as UserId,
          ip,
          logger,
        })
        if (loggedInUser instanceof Error)
          throw new ApolloError("Invalid user authentication", "INVALID_AUTHENTICATION", {
            reason: loggedInUser,
          })
        domainUser = loggedInUser

        addAttributesToCurrentSpan({ [ACCOUNT_USERNAME]: domainAccount?.username })
      }

      return {
        logger,
        // FIXME: we should not return this for the admin graphql endpoint
        domainUser,
        domainAccount,
        geetest,
        ip,
      }
    },
  )
}

export const startApolloServer = async ({
  schema,
  port,
  startSubscriptionServer = false,
  type,
}: {
  schema: GraphQLSchema
  port: string | number
  startSubscriptionServer?: boolean
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

  const apolloServer = new ApolloServer({
    schema,
    cache: "bounded",
    introspection: apolloConfig.playground,
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
        throw mapError(err)
      }
    },
  })

  app.use("/auth", authRouter)

  const enablePolicy = apolloConfig.playground ? false : undefined

  app.use(
    helmet({
      crossOriginEmbedderPolicy: enablePolicy,
      crossOriginOpenerPolicy: enablePolicy,
      crossOriginResourcePolicy: enablePolicy,
      contentSecurityPolicy: enablePolicy,
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

  app.use(
    PinoHttp({
      logger: graphqlLogger,
      wrapSerializers: false,
      autoLogging: {
        ignore: (req) => req.url === "/healthz",
      },
    }),
  )

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

  app.use(updateToken)

  app.use("/graphql", setGqlContext)

  await apolloServer.start()

  apolloServer.applyMiddleware({ app, path: "/graphql" })

  return new Promise((resolve, reject) => {
    httpServer.listen({ port }, () => {
      if (startSubscriptionServer) {
        const apolloSubscriptionServer = new SubscriptionServer(
          {
            execute: execute as unknown as ExecuteFunction,
            subscribe: subscribe as unknown as SubscribeFunction,
            schema,
            async onConnect(
              connectionParams: Record<string, unknown>,
              webSocket: unknown,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              connectionContext: any,
            ) {
              const { request } = connectionContext

              const authz = (connectionParams.authorization ||
                connectionParams.Authorization) as string | undefined
              // TODO: also manage the case where there is a cookie in the request

              // make request to oathkeeper
              const originalToken = authz?.slice(7) as
                | LegacyJwtToken
                | SessionToken
                | undefined

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
                ip: request?.socket?.remoteAddress,

                // TODO: Resolve what's needed here
                body: null,
              })
            },
          },
          {
            server: httpServer,
            path: apolloServer.graphqlPath,
          },
        )
        ;["SIGINT", "SIGTERM"].forEach((signal) => {
          process.on(signal, () => apolloSubscriptionServer.close())
        })
      }

      console.log(
        `🚀 "${type}" server ready at http://localhost:${port}${apolloServer.graphqlPath}`,
      )
      resolve({ app, httpServer, apolloServer })
    })

    httpServer.on("error", (err) => {
      console.error(err)
      reject(err)
    })
  })
}
