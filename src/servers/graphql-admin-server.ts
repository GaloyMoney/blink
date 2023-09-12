import { applyMiddleware } from "graphql-middleware"
import { and, rule, shield } from "graphql-shield"
import { RuleAnd } from "graphql-shield/typings/rules"

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

import { checkedToUserId } from "@domain/accounts"

import { AccountsRepository } from "@services/mongoose"

import { isAuthenticated, startApolloServer } from "./graphql-server"

export const isEditor = rule({ cache: "contextual" })((
  parent,
  args,
  ctx: GraphQLAdminContext,
) => {
  return ctx.isEditor ? true : new AuthorizationError({ logger: baseLogger })
})

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

  // can be anon.
  // TODO: refactor to remove auth endpoint and make context always carry a uuid v4 .sub/UserId
  const auditorId = tokenPayload.sub as UserId

  let isEditor = false

  // TODO: should be using casbin instead of account
  if (auditorId !== "anon") {
    const userId = checkedToUserId(auditorId)
    if (userId instanceof Error) throw userId // need to throw otherwise the request hangs

    const account = await AccountsRepository().findByUserId(userId)
    if (account instanceof Error) throw account // need to throw otherwise the request hangs
    isEditor = account.isEditor
  }

  req.gqlContext = { ip, loaders, auditorId, logger, isEditor }

  addAttributesToCurrentSpanAndPropagate(
    {
      [SemanticAttributes.HTTP_CLIENT_IP]: ip,
      [SemanticAttributes.HTTP_USER_AGENT]: req.headers["user-agent"],
      [SemanticAttributes.ENDUSER_ID]: tokenPayload.sub,
    },
    next,
  )
}

export async function startApolloServerForAdminSchema() {
  const authedQueryFields: { [key: string]: RuleAnd } = {}
  for (const key of Object.keys(adminQueryFields.authed)) {
    authedQueryFields[key] = and(isAuthenticated, isEditor)
  }

  const authedMutationFields: { [key: string]: RuleAnd } = {}
  for (const key of Object.keys(adminMutationFields.authed)) {
    authedMutationFields[key] = and(isAuthenticated, isEditor)
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
