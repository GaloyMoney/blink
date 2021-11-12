import * as Accounts from "@app/accounts"

const InvalidWalletError = (message: string) => ({ errors: [{ message }] })

const validateWalletId = async (resolve, parent, args, context, info) => {
  const { walletId } = args.input || {}
  if (!walletId) return InvalidWalletError("Invalid wallet")
  if (walletId instanceof Error) return InvalidWalletError(walletId.message)

  const hasPermissions = await Accounts.hasPermissions(context.domainUser.id, walletId)
  if (hasPermissions instanceof Error) return InvalidWalletError(hasPermissions.message)
  if (!hasPermissions) return InvalidWalletError("Invalid wallet")

  return resolve(parent, args, context, info)
}

export const walletIdMiddleware = {
  Mutation: {
    onChainAddressCreate: validateWalletId,
  },
}
