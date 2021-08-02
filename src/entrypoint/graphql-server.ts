import { ApolloServer } from "apollo-server-express"
import express from "express"
import expressJwt from "express-jwt"
import { rule } from "graphql-shield"
import mongoose from "mongoose"
import pino from "pino"
import PinoHttp from "pino-http"
import { v4 as uuidv4 } from "uuid"
import { yamlConfig } from "../config"
import { AuthorizationError, IPBlacklistedError } from "../error"
import { baseLogger } from "../logger"
import { redis } from "../redis"
import { User } from "../schema"
import helmet from "helmet"
import { isDev, updateIPDetails, isIPBlacklisted } from "../utils"
import { WalletFactory } from "../wallet-factory"

const graphqlLogger = baseLogger.child({ module: "graphql" })

export const isAuthenticated = rule({ cache: "contextual" })((parent, args, ctx) => {
  if (ctx.uid === null) {
    throw new AuthorizationError(undefined, {
      logger: graphqlLogger,
      request: ctx.request.body,
    })
  }
  return true
})

export const isEditor = rule({ cache: "contextual" })((parent, args, ctx) => {
  return ctx.user.role === "editor"
})

export const startApolloServer = async ({
  schema,
  port,
}): Promise<Record<string, unknown>> => {
  const app = express()
  const server = new ApolloServer({
    schema,
    playground: process.env.NETWORK !== "mainnet",
    introspection: process.env.NETWORK !== "mainnet",
    context: async (context) => {
      // @ts-expect-error: TODO
      const token = context.req?.token ?? null
      const uid = token?.uid ?? null
      const ip = context.req?.headers["x-real-ip"]

      if (isIPBlacklisted({ ip })) {
        throw new IPBlacklistedError("IP Blacklisted", { logger: graphqlLogger, ip })
      }

      let wallet, user

      // TODO move from id: uuidv4() to a Jaeger standard
      const logger = graphqlLogger.child({ token, id: uuidv4(), body: context.req?.body })

      if (uid) {
        user = await User.findOneAndUpdate(
          { _id: uid },
          { lastConnection: new Date() },
          { new: true },
        )

        if (yamlConfig.ipRecording.enabled) {
          updateIPDetails({ ip, user, logger })
        }

        wallet =
          !!user && user.status === "active"
            ? await WalletFactory({ user, logger })
            : null
      }

      return {
        ...context,
        logger,
        uid,
        wallet,
        user,
        ip,
      }
    },
    formatError: (err) => {
      const log = err.extensions?.exception?.log

      // An err object needs to necessarily have the forwardToClient field to be forwarded
      // i.e. catch-all errors will not be forwarded
      if (log) {
        const errObj = { message: err.message, code: err.extensions?.code }

        // we are logging additional details but not sending those to the client
        // ex: fields that indicate whether a payment succeeded or not, or stacktraces, that are required
        // for metrics or debugging
        // the err.extensions.metadata field contains such fields
        log({ ...errObj, ...err.extensions?.metadata })
        if (err.extensions?.exception.forwardToClient) {
          return errObj
        }
      } else {
        graphqlLogger.error(err)
      }

      return isDev ? err : new Error("Internal server error")
    },
  })

  app.use(helmet({ contentSecurityPolicy: isDev ? false : undefined }))

  app.use(
    PinoHttp({
      logger: graphqlLogger,
      wrapSerializers: false,

      // Define custom serializers
      serializers: {
        // TODO: sanitize
        err: pino.stdSerializers.err,
        req: pino.stdSerializers.req,
        res: (res) => ({
          // FIXME: kind of a hack. body should be in in req. but have not being able to do it.
          body: res.req.body,
          ...pino.stdSerializers.res(res),
        }),
      },
      autoLogging: {
        ignorePaths: ["/healthz"],
      },
    }),
  )

  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not set")
  }

  app.use(
    expressJwt({
      secret: process.env.JWT_SECRET,
      algorithms: ["HS256"],
      credentialsRequired: false,
      requestProperty: "token",
    }),
  )

  // Health check
  app.get("/healthz", async function (req, res) {
    const isMongoAlive = mongoose.connection.readyState === 1 ? true : false
    const isRedisAlive = (await redis.ping()) === "PONG"
    res.status(isMongoAlive && isRedisAlive ? 200 : 503).send()
  })

  server.applyMiddleware({ app })

  return await new Promise((resolve, reject) => {
    const httpServer = app.listen({ port })

    httpServer.on("listening", () => {
      console.log(`🚀 Server ready at http://localhost:${port}${server.graphqlPath}`)
      resolve({ server, app, httpServer })
    })

    httpServer.on("error", (err) => {
      console.error(err)
      reject(err)
    })
  })
}
