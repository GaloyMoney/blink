import { GT } from "@graphql/index"
import * as Wallets from "@app/wallets"
import * as Accounts from "@app/accounts"
import OnChainAddressPayload from "@graphql/types/payload/on-chain-address"
import WalletId from "@graphql/types/scalar/wallet-id"
import { mapError } from "@graphql/error-map"

const OnChainAddressCreateInput = new GT.Input({
  name: "OnChainAddressCreateInput",
  fields: () => ({
    walletId: { type: GT.NonNull(WalletId) },
  }),
})

const OnChainAddressCreateMutation = GT.Field({
  type: GT.NonNull(OnChainAddressPayload),
  args: {
    input: { type: GT.NonNull(OnChainAddressCreateInput) },
  },
  resolve: async (_, args, { domainUser }) => {
    const { walletId } = args.input
    if (walletId instanceof Error) {
      return { errors: [{ message: walletId.message }] }
    }

    let address: OnChainAddress | Error | null = null

    const hasPermissions = await Accounts.hasPermissions(domainUser.id, walletId)
    if (hasPermissions instanceof Error) {
      return { errors: [{ message: hasPermissions.message }] }
    }

    if (!hasPermissions) {
      return { errors: [{ message: "Invalid wallet" }] }
    }

    address = await Wallets.createOnChainAddressByWalletPublicId(walletId)
    if (address instanceof Error) {
      const appErr = mapError(address)
      return { errors: [{ message: appErr.message }] }
    }

    const account = await Accounts.getAccount(domainUser.defaultAccountId)
    if (account instanceof Error) {
      return { errors: [{ message: account.message }] }
    }

    if (!account.walletIds.length) {
      return { errors: [{ message: "Account does not have a default wallet" }] }
    }

    address = await Wallets.createOnChainAddress(account.walletIds[0])
    if (address instanceof Error) {
      const appErr = mapError(address)
      return { errors: [{ message: appErr.message }] }
    }

    return {
      errors: [],
      address,
    }
  },
})

export default OnChainAddressCreateMutation
