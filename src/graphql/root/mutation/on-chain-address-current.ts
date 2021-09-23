import { GT } from "@graphql/index"
import OnChainAddressPayload from "@graphql/types/payload/on-chain-address"
import WalletId from "@graphql/types/scalar/wallet-id"

import * as Wallets from "@app/wallets"
import * as Accounts from "@app/accounts"

const OnChainAddressCurrentInput = new GT.Input({
  name: "OnChainAddressCurrentInput",
  fields: () => ({
    walletId: { type: WalletId },
  }),
})

const OnChainAddressCurrentMutation = GT.Field({
  type: GT.NonNull(OnChainAddressPayload),
  args: {
    input: { type: GT.NonNull(OnChainAddressCurrentInput) },
  },
  resolve: async (_, args, { domainUser }) => {
    const { walletId } = args.input
    if (walletId && walletId instanceof Error) {
      return { errors: [{ message: walletId.message }] }
    }

    let address: OnChainAddress | Error | null = null
    if (walletId) {
      const hasPermissions = await Accounts.hasPermissions(domainUser.id, walletId)
      if (hasPermissions instanceof Error) {
        return { errors: [{ message: hasPermissions.message }] }
      }

      if (!hasPermissions) {
        return { errors: [{ message: "Invalid wallet" }] }
      }

      address = await Wallets.getLastOnChainAddressByWalletPublicId(walletId)
    }

    if (!address) {
      const account = await Accounts.getAccount(domainUser.defaultAccountId)
      if (account instanceof Error) {
        return { errors: [{ message: account.message }] }
      }

      if (!account.walletIds.length) {
        return { errors: [{ message: "Account does not have a default wallet" }] }
      }

      address = await Wallets.getLastOnChainAddress(account.walletIds[0])
    }

    if (address instanceof Error) {
      return { errors: [{ message: address.message }] }
    }

    return {
      errors: [],
      address,
    }
  },
})

export default OnChainAddressCurrentMutation
