import { applyMiddleware } from "graphql-middleware"
import { rule, shield } from "graphql-shield"
import { Rule } from "graphql-shield/typings/rules"

import { NextFunction, Request, Response } from "express"

import DataLoader from "dataloader"

import { startApolloServer } from "./graphql-server"

import { baseLogger } from "@/services/logger"

import { adminMutationFields, adminQueryFields, gqlAdminSchema } from "@/graphql/admin"

import { GALOY_ADMIN_PORT } from "@/config"

import {
  SemanticAttributes,
  addAttributesToCurrentSpanAndPropagate,
  recordExceptionInCurrentSpan,
} from "@/services/tracing"

import { Transactions } from "@/app"

import { AuthorizationError } from "@/graphql/error"

const setGqlAdminContext = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const logger = baseLogger
  const tokenPayload = req.token

  // TODO: loaders probably not needed for the admin panel
  const loaders = {
    txnMetadata: new DataLoader(async (keys) => {
      const txnMetadata = await Transactions.getTransactionsMetadataByIds(
        keys as LedgerTransactionId[],
      )
      if (txnMetadata instanceof Error) {
        recordExceptionInCurrentSpan({
          error: txnMetadata,
        })

        return keys.map(() => undefined)
      }

      return txnMetadata
    }),
  }

  const privilegedClientId = tokenPayload.sub as PrivilegedClientId

  req.gqlContext = { loaders, privilegedClientId, logger }

  addAttributesToCurrentSpanAndPropagate(
    {
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
  return (
    ctx.privilegedClientId !== null &&
    ctx.privilegedClientId !== undefined &&
    ctx.privilegedClientId !== ""
  )
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
