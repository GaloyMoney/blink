import { GraphQLResolveInfo, GraphQLFieldResolver } from "graphql"

import { Accounts } from "@/app"
import { mapError } from "@/graphql/error-map"
import { mutationFields, queryFields } from "@/graphql/public"
import { InvalidAccountError, InvalidWalletForAccountError } from "@/domain/accounts"
import { InvalidWalletId } from "@/domain/errors"

type InputArgs = Record<"input", Record<string, unknown>>

const validateWalletId = async (
  resolve: GraphQLFieldResolver<unknown, GraphQLPublicContextAuth>,
  parent: unknown,
  args: unknown,
  context: GraphQLPublicContextAuth,
  info: GraphQLResolveInfo,
) => {
  const { walletId } = (args as InputArgs).input || args || {}
  if (!walletId) return mapError(new InvalidWalletId())
  if (walletId instanceof Error) return walletId

  if (!("domainAccount" in context) || !context.domainAccount) {
    return mapError(new InvalidAccountError())
  }

  const hasPermissions = await Accounts.hasPermissions(
    context.domainAccount.id,
    walletId as WalletId,
  )
  if (hasPermissions instanceof Error) {
    return mapError(hasPermissions)
  }
  if (!hasPermissions) return mapError(new InvalidWalletForAccountError())

  return resolve(parent, args, context, info)
}

const validateWalletIdQuery = async (
  resolve: GraphQLFieldResolver<unknown, GraphQLPublicContextAuth>,
  parent: unknown,
  args: unknown,
  context: GraphQLPublicContextAuth,
  info: GraphQLResolveInfo,
) => {
  const result = await validateWalletId(resolve, parent, args, context, info)
  if (result instanceof Error) throw result
  return result
}

const validateWalletIdMutation = async (
  resolve: GraphQLFieldResolver<unknown, GraphQLPublicContextAuth>,
  parent: unknown,
  args: unknown,
  context: GraphQLPublicContextAuth,
  info: GraphQLResolveInfo,
) => {
  const result = await validateWalletId(resolve, parent, args, context, info)
  if (result instanceof Error) return { errors: [{ message: result.message }] }
  return result
}

// Placed here because 'GraphQLFieldResolver' not working from .d.ts file
type ValidateWalletIdFn = (
  resolve: GraphQLFieldResolver<unknown, GraphQLPublicContextAuth>,
  parent: unknown,
  args: unknown,
  context: GraphQLPublicContextAuth,
  info: GraphQLResolveInfo,
) => Promise<unknown>

const walletIdQueryFields: { [key: string]: ValidateWalletIdFn } = {}
for (const key of Object.keys(queryFields.authed.atWalletLevel)) {
  walletIdQueryFields[key] = validateWalletIdQuery
}

const walletIdMutationFields: { [key: string]: ValidateWalletIdFn } = {}
for (const key of Object.keys({
  ...mutationFields.authed.atWalletLevel.send,
  ...mutationFields.authed.atWalletLevel.receive,
})) {
  walletIdMutationFields[key] = validateWalletIdMutation
}

export const walletIdMiddleware = {
  Query: walletIdQueryFields,
  Mutation: walletIdMutationFields,
}
