import { applyMiddleware } from "graphql-middleware"
import { and, shield } from "graphql-shield"
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
} from "@services/tracing"

import { parseIps } from "@domain/accounts-ips"

import { isAuthenticated, isEditor, startApolloServer } from "./graphql-server"

const graphqlLogger = baseLogger.child({ module: "graphql" })

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
    { allowExternalErrors: true },
  )

  const schema = applyMiddleware(gqlAdminSchema, permissions)
  return startApolloServer({
    schema,
    port: GALOY_ADMIN_PORT,
    type: "admin",
    setGqlContext,
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
