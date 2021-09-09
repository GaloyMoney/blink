import { GT } from "@graphql/index"
import * as Wallets from "@app/wallets"
import * as Accounts from "@app/accounts"
import WalletName from "@graphql/types/scalar/wallet-name"
import OnChainAddressPayload from "@graphql/types/payload/on-chain-address"

const OnChainAddressCurrentInput = new GT.Input({
  name: "OnChainAddressCurrentInput",
  fields: () => ({
    walletName: { type: WalletName },
  }),
})

const OnChainAddressCurrentMutation = GT.Field({
  type: GT.NonNull(OnChainAddressPayload),
  args: {
    input: { type: GT.NonNull(OnChainAddressCurrentInput) },
  },
  resolve: async (_, args, { domainUser }) => {
    const { walletName } = args.input
    if (walletName && walletName instanceof Error) {
      return { errors: [{ message: walletName.message }] }
    }

    let address: OnChainAddress | Error | null = null
    if (walletName) {
      const hasPermissions = await Accounts.hasPermissions(domainUser.id, walletName)
      if (hasPermissions instanceof Error) {
        return { errors: [{ message: hasPermissions.message }] }
      }

      if (!hasPermissions) {
        return { errors: [{ message: "Invalid walletName" }] }
      }

      address = await Wallets.getLastOnChainAddressByWalletName(walletName)
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
