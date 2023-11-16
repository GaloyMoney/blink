import { GraphQLResolveInfo, GraphQLFieldResolver } from "graphql"

import ScopesOauth2 from "@/domain/authorization"
import { AuthorizationError } from "@/domain/errors"
import { mapError } from "@/graphql/error-map"
import { mutationFields, queryFields } from "@/graphql/public"

const readAuthorize = async (
  resolve: GraphQLFieldResolver<unknown, GraphQLPublicContextAuth>,
  parent: unknown,
  args: unknown,
  context: GraphQLPublicContextAuth,
  info: GraphQLResolveInfo,
) => {
  const scope = context.scope

  // not a token with scope
  if (scope === undefined || scope.length === 0) {
    return resolve(parent, args, context, info)
  }

  if (scope.find((s) => s === ScopesOauth2.Read) !== undefined) {
    return resolve(parent, args, context, info)
  }

  return mapError(new AuthorizationError("not authorized to read data"))
}

const writeAuthorize = async (
  resolve: GraphQLFieldResolver<unknown, GraphQLPublicContextAuth>,
  parent: unknown,
  args: unknown,
  context: GraphQLPublicContextAuth,
  info: GraphQLResolveInfo,
) => {
  const scope = context.scope

  // not a token with scope
  if (scope === undefined || scope.length === 0) {
    return resolve(parent, args, context, info)
  }

  if (scope.find((s) => s === ScopesOauth2.Write) !== undefined) {
    return resolve(parent, args, context, info)
  }

  return mapError(new AuthorizationError("not authorized to execute mutations"))
}

// Placed here because 'GraphQLFieldResolver' not working from .d.ts file
type ValidateFn = (
  resolve: GraphQLFieldResolver<unknown, GraphQLPublicContextAuth>,
  parent: unknown,
  args: unknown,
  context: GraphQLPublicContextAuth,
  info: GraphQLResolveInfo,
) => Promise<unknown>

const authedQueryFields: { [key: string]: ValidateFn } = {}
for (const key of Object.keys({
  ...queryFields.authed.atAccountLevel,
  ...queryFields.authed.atWalletLevel,
})) {
  authedQueryFields[key] = readAuthorize
}

const authedMutationFields: { [key: string]: ValidateFn } = {}
for (const key of Object.keys({
  ...mutationFields.authed.atAccountLevel,
  ...mutationFields.authed.atWalletLevel,
})) {
  authedMutationFields[key] = writeAuthorize
}

export const scopeMiddleware = {
  Query: authedQueryFields,
  Mutation: authedMutationFields,
}
