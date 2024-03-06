import { mapError } from "@/graphql/error-map"
import { mutationFields, queryFields } from "@/graphql/public"
import { GraphQLResolveInfo, GraphQLFieldResolver } from "graphql"

import { AuthorizationError } from "@/domain/errors"
import { ScopesOauth2 } from "@/domain/authorization"

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

  if (scope.find((s) => s === ScopesOauth2.Read)) {
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

const receiveAuthorize = async (
  resolve: GraphQLFieldResolver<unknown, GraphQLPublicContextAuth>,
  parent: unknown,
  args: unknown,
  context: GraphQLPublicContextAuth,
  info: GraphQLResolveInfo,
) => {
  const scope = context.scope

  // not a token with scope
  if (!scope || scope.length === 0) {
    return resolve(parent, args, context, info)
  }

  if (scope.find((s) => s === ScopesOauth2.Receive)) {
    return resolve(parent, args, context, info)
  }

  return writeAuthorize(resolve, parent, args, context, info)
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
  ...mutationFields.authed.atWalletLevel.send,
})) {
  authedMutationFields[key] = writeAuthorize
}
for (const key of Object.keys({
  ...mutationFields.authed.atWalletLevel.receive,
})) {
  authedMutationFields[key] = receiveAuthorize
}

export const scopeMiddleware = {
  Query: authedQueryFields,
  Mutation: authedMutationFields,
}
