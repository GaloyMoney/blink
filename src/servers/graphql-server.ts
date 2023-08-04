import { createServer } from "http"

import DataLoader from "dataloader"
import express, { NextFunction, Request, Response } from "express"

import { Accounts, Transactions } from "@app"
import { getApolloConfig, getJwksArgs, isProd } from "@config"
import { baseLogger } from "@services/logger"
import {
  ACCOUNT_USERNAME,
  SemanticAttributes,
  addAttributesToCurrentSpan,
  addAttributesToCurrentSpanAndPropagate,
  recordExceptionInCurrentSpan,
} from "@services/tracing"
import {
  ApolloServerPluginDrainHttpServer,
  ApolloServerPluginLandingPageDisabled,
  ApolloServerPluginLandingPageGraphQLPlayground,
} from "apollo-server-core"
import { ApolloError, ApolloServer } from "apollo-server-express"
import { GetVerificationKey, expressjwt } from "express-jwt"
import { GraphQLError, GraphQLSchema } from "graphql"
import { rule } from "graphql-shield"
import helmet from "helmet"
import jsonwebtoken from "jsonwebtoken"
import PinoHttp from "pino-http"

import { AuthenticationError, AuthorizationError } from "@graphql/error"
import { mapError } from "@graphql/error-map"

import { parseIps } from "@domain/accounts-ips"

import { fieldExtensionsEstimator, simpleEstimator } from "graphql-query-complexity"

import { createComplexityPlugin } from "graphql-query-complexity-apollo-plugin"

import jwksRsa from "jwks-rsa"

import { UsersRepository } from "@services/mongoose"
import { checkedToUserId } from "@domain/accounts"
import { CouldNotFindAccountFromKratosIdError } from "@domain/errors"
import { ValidationError, parseUnknownDomainErrorFromUnknown } from "@domain/shared"

import { playgroundTabs } from "../graphql/playground"

import { idempotencyMiddleware } from "./middlewares/idempotency"
import healthzHandler from "./middlewares/healthz"
import kratosRouter from "./authorization/kratos-router"
import authRouter from "./authorization"

const graphqlLogger = baseLogger.child({
  module: "graphql",
})

const apolloConfig = getApolloConfig()

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

  const body = req.body ?? null

  const ipString = isProd
    ? req.headers["x-real-ip"] || req.headers["x-forwarded-for"]
    : req.ip

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
      [SemanticAttributes.HTTP_USER_AGENT]: req.headers["user-agent"],
      [ACCOUNT_USERNAME]: gqlContext.domainAccount?.username,
      [SemanticAttributes.ENDUSER_ID]: gqlContext.domainAccount?.id || tokenPayload?.sub,
    },
    next,
  )
}

export const sessionContext = ({
  tokenPayload,
  ip,
  body,
}: {
  tokenPayload: jsonwebtoken.JwtPayload
  ip: IpAddress | undefined
  body: unknown
}): Promise<GraphQLContext> => {
  const logger = graphqlLogger.child({ tokenPayload, body })

  let domainAccount: Account | undefined
  let user: User | undefined

  return addAttributesToCurrentSpanAndPropagate(
    {
      "token.sub": tokenPayload?.sub,
      "token.iss": tokenPayload?.iss,
      [SemanticAttributes.HTTP_CLIENT_IP]: ip,
    },
    async () => {
      // note: value should match (ie: "anon") if not an accountId
      // settings from dev/ory/oathkeeper.yml/authenticator/anonymous/config/subjet
      const maybeUserId = checkedToUserId(tokenPayload?.sub ?? "")

      if (!(maybeUserId instanceof ValidationError)) {
        const userId = maybeUserId
        const account = await Accounts.getAccountFromUserId(userId)
        if (account instanceof CouldNotFindAccountFromKratosIdError) {
          // do nothing, the jwt is valid but the account does not exist
          // TODO: refactor to remove https://github.com/GaloyMoney/galoy/pull/2071/files#diff-2a3744191b13e4b2375d4bc44df6706cd453f9b3ccbf3970f801ad4ce97219aaR16
          // or of the graphql in a rest endoing.
          // more context: https://github.com/GaloyMoney/galoy/pull/2071/files#r1214595029
        } else if (account instanceof Error) {
          throw mapError(account)
        } else {
          domainAccount = account
          // not awaiting on purpose. just updating metadata
          // TODO: look if this can be a source of memory leaks
          Accounts.updateAccountIPsInfo({
            accountId: account.id,
            ip,
            logger,
          })
          const userRes = await UsersRepository().findById(account.kratosUserId)
          if (userRes instanceof Error) throw mapError(userRes)
          user = userRes
          addAttributesToCurrentSpan({ [ACCOUNT_USERNAME]: domainAccount?.username })
        }
      }

      const loaders = {
        txnMetadata: new DataLoader(async (keys) => {
          const txnMetadata = await Transactions.getTransactionsMetadataByIds(
            keys as LedgerTransactionId[],
          )
          if (txnMetadata instanceof Error) {
            recordExceptionInCurrentSpan({
              error: txnMetadata,
              level: txnMetadata.level,
            })

            return keys.map(() => undefined)
          }

          return txnMetadata
        }),
      }

      return {
        logger,
        loaders,
        // FIXME: we should not return this for the admin graphql endpoint
        user,
        domainAccount,
        ip,
      }
    },
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
        throw mapError(parseUnknownDomainErrorFromUnknown(err))
      }
    },
  })

  app.use("/auth", authRouter)
  app.use("/kratos", kratosRouter)

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

      if (!isProd) {
        console.log(
          `in dev mode, ${type} server should be accessed through oathkeeper reverse proxy at ${
            type === "admin"
              ? "http://localhost:4002/admin/graphql"
              : "http://localhost:4002/graphql"
          }`,
        )
      }

      resolve({ app, httpServer, apolloServer })
    })

    httpServer.on("error", (err) => {
      console.error(err)
      reject(err)
    })
  })
}
