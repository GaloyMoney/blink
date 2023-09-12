import { applyMiddleware } from "graphql-middleware"

import { GALOY_API_PORT, UNSECURE_IP_FROM_REQUEST_OBJECT } from "@config"

import { AuthorizationError } from "@graphql/error"
import { gqlMainSchema, mutationFields, queryFields } from "@graphql/public"

import { bootstrap } from "@app/bootstrap"
import { activateLndHealthCheck } from "@services/lnd/health"
import { baseLogger } from "@services/logger"
import { setupMongoConnection } from "@services/mongodb"
import { shield } from "graphql-shield"
import { Rule } from "graphql-shield/typings/rules"

import { NextFunction, Request, Response } from "express"

import {
  ACCOUNT_USERNAME,
  SemanticAttributes,
  addAttributesToCurrentSpanAndPropagate,
} from "@services/tracing"

import { parseIps } from "@domain/accounts-ips"

import { startApolloServerForAdminSchema } from "./graphql-admin-server"
import { isAuthenticated, startApolloServer } from "./graphql-server"
import { walletIdMiddleware } from "./middlewares/wallet-id"

import { sessionPublicContext } from "./middlewares/session"

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

  req.gqlContext = gqlContext

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

export async function startApolloServerForCoreSchema() {
  const authedQueryFields: { [key: string]: Rule } = {}
  for (const key of Object.keys({
    ...queryFields.authed.atAccountLevel,
    ...queryFields.authed.atWalletLevel,
  })) {
    authedQueryFields[key] = isAuthenticated
  }

  const authedMutationFields: { [key: string]: Rule } = {}
  for (const key of Object.keys({
    ...mutationFields.authed.atAccountLevel,
    ...mutationFields.authed.atWalletLevel,
  })) {
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

  const schema = applyMiddleware(gqlMainSchema, permissions, walletIdMiddleware)
  return startApolloServer({
    schema,
    port: GALOY_API_PORT,
    type: "main",
    setGqlContext,
  })
}

if (require.main === module) {
  setupMongoConnection(true)
    .then(async () => {
      activateLndHealthCheck()

      const res = await bootstrap()
      if (res instanceof Error) throw res

      await Promise.race([
        startApolloServerForCoreSchema(),
        startApolloServerForAdminSchema(),
      ])
    })
    .catch((err) => baseLogger.error(err, "server error"))
}
