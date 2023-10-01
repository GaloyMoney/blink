import { applyMiddleware } from "graphql-middleware"
import { rule, shield } from "graphql-shield"
import { Rule } from "graphql-shield/typings/rules"

import { baseLogger } from "@services/logger"
import { setupMongoConnection } from "@services/mongodb"

import { activateLndHealthCheck } from "@services/lnd/health"

import { adminMutationFields, adminQueryFields, gqlAdminSchema } from "@graphql/admin"

import { GALOY_ADMIN_PORT, UNSECURE_IP_FROM_REQUEST_OBJECT } from "@config"

import { NextFunction, Request, Response } from "express"

import {
  SemanticAttributes,
  addAttributesToCurrentSpanAndPropagate,
  recordExceptionInCurrentSpan,
} from "@services/tracing"

import { parseIps } from "@domain/accounts-ips"

import DataLoader from "dataloader"

import { Transactions } from "@app"

import { AuthorizationError } from "@graphql/error"

import { startApolloServer } from "./graphql-server"

const graphqlLogger = baseLogger.child({ module: "graphql" })

const setGqlAdminContext = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const logger = baseLogger
  const tokenPayload = req.token

  const ipString = UNSECURE_IP_FROM_REQUEST_OBJECT
    ? req.ip
    : req.headers["x-real-ip"] || req.headers["x-forwarded-for"]

  const ip = parseIps(ipString)
  if (!ip) {
    logger.error("ip missing")
    return
  }

  // TODO: loaders probably not needed for the admin panel
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

  const auditorId = tokenPayload.sub as AuditorId

  req.gqlContext = { ip, loaders, auditorId, logger }

  addAttributesToCurrentSpanAndPropagate(
    {
      [SemanticAttributes.HTTP_CLIENT_IP]: ip,
      [SemanticAttributes.HTTP_USER_AGENT]: req.headers["user-agent"],
      [SemanticAttributes.ENDUSER_ID]: tokenPayload.sub,
    },
    next,
  )
}

const isAuthenticated = rule({ cache: "contextual" })(async (
  parent,
  args,
  ctx: GraphQLAdminContext,
) => {
  return ctx.auditorId !== null && ctx.auditorId !== undefined && ctx.auditorId !== ""
})

export async function startApolloServerForAdminSchema() {
  const authedQueryFields: { [key: string]: Rule } = {}
  for (const key of Object.keys(adminQueryFields.authed)) {
    authedQueryFields[key] = isAuthenticated
  }

  const authedMutationFields: { [key: string]: Rule } = {}
  for (const key of Object.keys(adminMutationFields.authed)) {
    authedMutationFields[key] = isAuthenticated
  }

  const permissions = shield(
    {
      Query: authedQueryFields,
      Mutation: authedMutationFields,
    },
    {
      allowExternalErrors: true,
      fallbackError: new AuthorizationError({ logger: baseLogger }),
    },
  )

  const schema = applyMiddleware(gqlAdminSchema, permissions)
  return startApolloServer({
    schema,
    port: GALOY_ADMIN_PORT,
    type: "admin",
    setGqlContext: setGqlAdminContext,
  })
}

if (require.main === module) {
  setupMongoConnection()
    .then(async () => {
      activateLndHealthCheck()
      await startApolloServerForAdminSchema()
    })
    .catch((err) => graphqlLogger.error(err, "server error"))
}
