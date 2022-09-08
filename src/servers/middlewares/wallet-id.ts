import { GraphQLResolveInfo, GraphQLFieldResolver } from "graphql"

import { Accounts } from "@app"
import { mapError } from "@graphql/error-map"

type InputArgs = Record<"input", Record<string, unknown>>

const validateWalletId = async (
  resolve: GraphQLFieldResolver<unknown, GraphQLContext | GraphQLContextForUser>,
  parent: unknown,
  args: unknown,
  context: GraphQLContext | GraphQLContextForUser,
  info: GraphQLResolveInfo,
) => {
  const { walletId } = (args as InputArgs).input || args || {}
  if (!walletId) return new Error("Invalid wallet")
  if (walletId instanceof Error) return walletId

  if (!context.domainAccount) {
    return new Error("Invalid Account")
  }

  const hasPermissions = await Accounts.hasPermissions(
    context.domainAccount.id,
    walletId as WalletId,
  )
  if (hasPermissions instanceof Error) return mapError(hasPermissions)
  if (!hasPermissions) return new Error("Invalid wallet")

  return resolve(parent, args, context, info)
}

const validateWalletIdQuery = async (
  resolve: GraphQLFieldResolver<unknown, GraphQLContext | GraphQLContextForUser>,
  parent: unknown,
  args: unknown,
  context: GraphQLContext | GraphQLContextForUser,
  info: GraphQLResolveInfo,
) => {
  const result = await validateWalletId(resolve, parent, args, context, info)
  if (result instanceof Error) throw result
  return result
}

const validateWalletIdMutation = async (
  resolve: GraphQLFieldResolver<unknown, GraphQLContext | GraphQLContextForUser>,
  parent: unknown,
  args: unknown,
  context: GraphQLContext | GraphQLContextForUser,
  info: GraphQLResolveInfo,
) => {
  const result = await validateWalletId(resolve, parent, args, context, info)
  if (result instanceof Error) return { errors: [{ message: result.message }] }
  return result
}

export const walletIdMiddleware = {
  Query: {
    onChainTxFee: validateWalletIdQuery,
  },
  Mutation: {
    intraLedgerPaymentSend: validateWalletIdMutation,
    lnInvoiceFeeProbe: validateWalletIdMutation,
    lnNoAmountInvoiceFeeProbe: validateWalletIdMutation,
    lnInvoiceCreate: validateWalletIdMutation,
    lnUsdInvoiceCreate: validateWalletIdMutation,
    lnNoAmountInvoiceCreate: validateWalletIdMutation,
    lnInvoicePaymentSend: validateWalletIdMutation,
    lnNoAmountInvoicePaymentSend: validateWalletIdMutation,
    lnNoAmountUsdInvoicePaymentSend: validateWalletIdMutation,
    onChainAddressCreate: validateWalletIdMutation,
    onChainAddressCurrent: validateWalletIdMutation,
    onChainPaymentSend: validateWalletIdMutation,
    onChainPaymentSendAll: validateWalletIdMutation,
  },
}
