import { createServer } from "http"

import DataLoader from "dataloader"

import { Accounts, Transactions } from "@app"
import { getApolloConfig, getGeetestConfig, getJwksArgs, isDev } from "@config"
import Geetest from "@services/geetest"
import { baseLogger } from "@services/logger"
import {
  ACCOUNT_USERNAME,
  SemanticAttributes,
  addAttributesToCurrentSpan,
  addAttributesToCurrentSpanAndPropagate,
} from "@services/tracing"
import {
  ApolloServerPluginDrainHttpServer,
  ApolloServerPluginLandingPageDisabled,
  ApolloServerPluginLandingPageGraphQLPlayground,
} from "apollo-server-core"
import { ApolloError, ApolloServer } from "apollo-server-express"
import cors from "cors"
import express, { NextFunction, Request, Response } from "express"
import { GetVerificationKey, expressjwt } from "express-jwt"
import { GraphQLError, GraphQLSchema, execute, subscribe } from "graphql"
import { rule } from "graphql-shield"
import { useServer } from "graphql-ws/lib/use/ws"
import helmet from "helmet"
import jsonwebtoken from "jsonwebtoken"
import PinoHttp from "pino-http"
import {
  ExecuteFunction,
  GRAPHQL_WS,
  SubscribeFunction,
  SubscriptionServer,
} from "subscriptions-transport-ws"
import { Context, GRAPHQL_TRANSPORT_WS_PROTOCOL } from "graphql-ws"

import { WebSocketServer } from "ws"

import { AuthenticationError, AuthorizationError } from "@graphql/error"
import { mapError } from "@graphql/error-map"

import { parseIps } from "@domain/accounts-ips"

import { fieldExtensionsEstimator, simpleEstimator } from "graphql-query-complexity"

import { createComplexityPlugin } from "graphql-query-complexity-apollo-plugin"

import jwksRsa from "jwks-rsa"

import { checkedToUserId } from "@domain/accounts"

import { sendOathkeeperRequest } from "@services/oathkeeper"

import { ValidationError } from "@domain/shared"

import { UsersRepository } from "@services/mongoose"

import { validateKratosCookie } from "@services/kratos"

import { playgroundTabs } from "../graphql/playground"

import authRouter from "./middlewares/auth-router"
import healthzHandler from "./middlewares/healthz"
import kratosRouter from "./middlewares/kratos-router"
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
  (parent, args, ctx: GraphQLContextAuth) => {
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

  let domainAccount: Account | undefined
  let user: User | undefined

  return addAttributesToCurrentSpanAndPropagate(
    {
      "token.sub": tokenPayload?.sub,
      [SemanticAttributes.HTTP_CLIENT_IP]: ip,
    },
    async () => {
      // note: value should match (ie: "anon") if not an accountId
      // settings from dev/ory/oathkeeper.yml/authenticator/anonymous/config/subjet
      const maybeUserId = checkedToUserId(tokenPayload?.sub || "")
      if (!(maybeUserId instanceof ValidationError)) {
        const userId = maybeUserId

        const account = await Accounts.getAccountFromUserId(userId)
        if (account instanceof Error) throw mapError(account)
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

      const loaders = {
        txnMetadata: new DataLoader(async (keys) => {
          const txnMetadata = await Transactions.getTransactionsMetadataByIds(
            keys as LedgerTransactionId[],
          )
          if (txnMetadata instanceof Error) throw mapError(txnMetadata)

          return txnMetadata
        }),
      }

      return {
        logger,
        loaders,
        // FIXME: we should not return this for the admin graphql endpoint
        user,
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

  if (isDev) {
    // to support CORS on different localhost ports in dev
    app.use(
      cors({
        credentials: true,
        origin: true,
      }),
    )
  }

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
      if (isDev) {
        // To make CORS work for cookies "credentials": "include" in dev
        // This needs to be manually added because localhost:3000 is seen
        // as a different origin from localhost:4002 and the CORS wildcard
        // "access-control-allow-origin": "*" setting cannot be used via W3C rules
        // This should work in prod if sites are on the same top level domain
        context.res.set({
          "access-control-allow-credentials": "true",
          "access-control-allow-methods": "PUT GET HEAD POST DELETE OPTIONS",
          "access-control-allow-origin": context.req.headers.origin,
        })
      }
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

  // old legacy ws
  const onConnectLegacy = async (
    connectionParams: Record<string, unknown>,
    webSocket: unknown,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    connectionContext: any,
  ) => {
    const { request } = connectionContext

    const authz = (connectionParams.authorization || connectionParams.Authorization) as
      | string
      | undefined

    // TODO: also manage the case where there is a cookie in the request
    // https://www.ory.sh/docs/oathkeeper/guides/proxy-websockets#configure-ory-oathkeeper-and-ory-kratos
    const cookies = request.headers.cookie
    if (cookies?.includes("ory_kratos_session")) {
      const kratosCookieRes = await validateKratosCookie(cookies)
      if (kratosCookieRes instanceof Error) return kratosCookieRes
      const tokenPayload = {
        sub: kratosCookieRes.kratosUserId,
      }
      return sessionContext({
        tokenPayload,
        ip: request?.socket?.remoteAddress,
        body: null,
      })
    }

    // make request to oathkeeper
    const originalToken = authz?.slice(7) as LegacyJwtToken | SessionToken | undefined

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
  }

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

    const kratosToken = authz?.slice(7) as LegacyJwtToken | SessionToken

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

  // from https://github.com/enisdenjo/graphql-ws/issues/36#issuecomment-715285764
  // TODO: this cache is naive. it doesn't have security implication because currently the websocket
  // is only receiving data, but if the token is revoked, it should not longer be be able to receive data.
  // authorizedContexts is currently only be flushed on server restart.
  // this could also have a memory leak if the server is never restarted and have lot of entities
  const authorizedContexts: Record<string, unknown> = {}

  return new Promise((resolve, reject) => {
    httpServer.listen({ port }, () => {
      if (startSubscriptionServer) {
        const graphqlWs = new WebSocketServer({ noServer: true })
        const serverCleanup = useServer(
          {
            schema,
            execute,
            subscribe,
            onConnect: async (ctx) => {
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
            onSubscribe: () => {
              /* ctx, message */
              // TODO: integrate open telemetry
            },
          },
          graphqlWs,
        )

        const subTransWs = new WebSocketServer({ noServer: true })
        const apolloSubscriptionServer = SubscriptionServer.create(
          {
            execute: execute as unknown as ExecuteFunction,
            subscribe: subscribe as unknown as SubscribeFunction,
            schema,
            onConnect: onConnectLegacy,
          },
          subTransWs,
        )
        ;["SIGINT", "SIGTERM"].forEach((signal) => {
          process.on(signal, () => {
            apolloSubscriptionServer.close()
            serverCleanup.dispose()
          })
        })

        httpServer.on("upgrade", (req, socket, head) => {
          // extract websocket subprotocol from header
          const protocol = req.headers["sec-websocket-protocol"]
          const protocols = Array.isArray(protocol)
            ? protocol
            : protocol?.split(",").map((p) => p.trim())

          // decide which websocket server to use
          const wss =
            protocols?.includes(GRAPHQL_WS) && // subscriptions-transport-ws subprotocol
            !protocols.includes(GRAPHQL_TRANSPORT_WS_PROTOCOL) // graphql-ws subprotocol
              ? subTransWs
              : // graphql-ws will welcome its own subprotocol and
                // gracefully reject invalid ones. if the client supports
                // both transports, graphql-ws will prevail
                graphqlWs
          wss.handleUpgrade(req, socket, head, (ws) => {
            wss.emit("connection", ws, req)
          })
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
