import { GraphQLResolveInfo, GraphQLFieldResolver } from "graphql"

import ScopesOauth2 from "@/domain/authorization"
import { AuthorizationError } from "@/domain/errors"
import { mapError } from "@/graphql/error-map"
import { mutationFields } from "@/graphql/public"

const readTransactionsAuthorize = async (
  resolve: GraphQLFieldResolver<unknown, GraphQLPublicContextAuth>,
  parent: unknown,
  args: unknown,
  context: GraphQLPublicContextAuth,
  info: GraphQLResolveInfo,
) => {
  const scope = context.scope
  const appId = context.appId

  // not a delegated token
  if (appId === undefined || appId === "") {
    return resolve(parent, args, context, info)
  }

  if (scope === undefined) {
    return mapError(new AuthorizationError("appId is defined but scope is undefined"))
  }

  if (scope.find((s) => s === ScopesOauth2.TransactionsRead) !== undefined) {
    return resolve(parent, args, context, info)
  }

  return mapError(new AuthorizationError("not authorized to read transactions"))
}

const paymentSendAuthorize = async (
  resolve: GraphQLFieldResolver<unknown, GraphQLPublicContextAuth>,
  parent: unknown,
  args: unknown,
  context: GraphQLPublicContextAuth,
  info: GraphQLResolveInfo,
) => {
  const scope = context.scope
  const appId = context.appId

  // not a delegated token
  if (appId === undefined || appId === "") {
    return resolve(parent, args, context, info)
  }

  if (scope === undefined) {
    return mapError(new AuthorizationError("appId is defined but scope is undefined"))
  }

  if (scope.find((s) => s === ScopesOauth2.PaymentsSend) !== undefined) {
    return resolve(parent, args, context, info)
  }

  return mapError(new AuthorizationError("not authorized to send payments"))
}

// Placed here because 'GraphQLFieldResolver' not working from .d.ts file
type ValidateWalletIdFn = (
  resolve: GraphQLFieldResolver<unknown, GraphQLPublicContextAuth>,
  parent: unknown,
  args: unknown,
  context: GraphQLPublicContextAuth,
  info: GraphQLResolveInfo,
) => Promise<unknown>

const walletIdMutationFields: { [key: string]: ValidateWalletIdFn } = {}
for (const key of Object.keys(mutationFields.authed.atWalletLevel)) {
  walletIdMutationFields[key] = paymentSendAuthorize
}

export const scopeMiddleware = {
  Query: {
    me: readTransactionsAuthorize,
  },
  Mutation: walletIdMutationFields,
}
