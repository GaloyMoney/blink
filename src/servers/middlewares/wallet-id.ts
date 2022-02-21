import { Accounts } from "@app"
import { mapError } from "@graphql/error-map"

const validateWalletId = async (resolve, parent, args, context, info) => {
  const { walletId } = args.input || args || {}
  if (!walletId) return new Error("Invalid wallet")
  if (walletId instanceof Error) return walletId

  const hasPermissions = await Accounts.hasPermissions(context.domainUser.id, walletId)
  if (hasPermissions instanceof Error) return mapError(hasPermissions)
  if (!hasPermissions) return new Error("Invalid wallet")

  return resolve(parent, args, context, info)
}

const validateWalletIdQuery = async (resolve, parent, args, context, info) => {
  const result = await validateWalletId(resolve, parent, args, context, info)
  if (result instanceof Error) throw result
  return result
}

const validateWalletIdMutation = async (resolve, parent, args, context, info) => {
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
