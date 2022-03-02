import { GT } from "@graphql/index"
import { mapError } from "@graphql/error-map"
import WalletId from "@graphql/types/scalar/wallet-id"
import OnChainAddressPayload from "@graphql/types/payload/on-chain-address"
import { Wallets } from "@app"
import { WalletsRepository } from "@services/mongoose"
import { WalletCurrency } from "@domain/shared"

const OnChainAddressCurrentInput = GT.Input({
  name: "OnChainAddressCurrentInput",
  fields: () => ({
    walletId: { type: GT.NonNull(WalletId) },
  }),
})

const OnChainAddressCurrentMutation = GT.Field({
  type: GT.NonNull(OnChainAddressPayload),
  args: {
    input: { type: GT.NonNull(OnChainAddressCurrentInput) },
  },
  resolve: async (_, args) => {
    const { walletId } = args.input
    if (walletId instanceof Error) {
      return { errors: [{ message: walletId.message }] }
    }

    const wallet = await WalletsRepository().findById(walletId)
    if (wallet instanceof Error)
      return { errors: [{ message: mapError(wallet).message }] }

    const MutationDoesNotMatchWalletCurrencyError =
      "MutationDoesNotMatchWalletCurrencyError"
    if (wallet.currency === WalletCurrency.Usd) {
      return { errors: [{ message: MutationDoesNotMatchWalletCurrencyError }] }
    }

    const address = await Wallets.getLastOnChainAddress(walletId)
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

export default OnChainAddressCurrentMutation
