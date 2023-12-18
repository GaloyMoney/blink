import { applyMiddleware } from "graphql-middleware"

import { rule, shield } from "graphql-shield"

import { Rule } from "graphql-shield/typings/rules"

import { NextFunction, Request, Response } from "express"

import { startApolloServer } from "./graphql-server"

import { walletIdMiddleware } from "./middlewares/wallet-id"

import { sessionPublicContext } from "./middlewares/session"

import { scopeMiddleware } from "./middlewares/scope"

import { GALOY_API_PORT, UNSECURE_IP_FROM_REQUEST_OBJECT } from "@/config"

import { AuthorizationError } from "@/graphql/error"
import { gqlPublicSchema, mutationFields, queryFields } from "@/graphql/public"

import { baseLogger } from "@/services/logger"

import {
  ACCOUNT_USERNAME,
  SemanticAttributes,
  addAttributesToCurrentSpanAndPropagate,
} from "@/services/tracing"

import { parseIps } from "@/domain/accounts-ips"
import { AccountStatus } from "@/domain/accounts"

const isAuthenticated = rule({ cache: "contextual" })((
  _parent,
  _args,
  ctx: GraphQLPublicContext,
) => {
  return "domainAccount" in ctx && !!ctx.domainAccount
})

const hasMutationPermissions = rule({ cache: "contextual" })((
  _parent,
  _args,
  ctx: GraphQLPublicContext | GraphQLPublicContextAuth,
) => {
  const isAuthenticated = "domainAccount" in ctx && !!ctx.domainAccount
  return isAuthenticated && ctx.domainAccount.status === AccountStatus.Active
})

const setGqlContext = async (
  req: Request,
  _res: Response,
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

  const username = "domainAccount" in gqlContext && gqlContext.domainAccount?.username

  return addAttributesToCurrentSpanAndPropagate(
    {
      "token.iss": tokenPayload?.iss,
      "token.session_id": tokenPayload?.session_id,
      "token.expires_at": tokenPayload?.expires_at,
      "token.scope": tokenPayload?.scope,
      "token.appId": tokenPayload?.appId,
      [SemanticAttributes.HTTP_CLIENT_IP]: ip,
      [SemanticAttributes.HTTP_USER_AGENT]: req.headers["user-agent"],
      [ACCOUNT_USERNAME]: username,
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
    authedMutationFields[key] = hasMutationPermissions
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

  const schema = applyMiddleware(
    gqlPublicSchema,
    permissions,
    walletIdMiddleware,
    scopeMiddleware,
  )

  return startApolloServer({
    schema,
    port: GALOY_API_PORT,
    type: "main",
    setGqlContext,
  })
}
