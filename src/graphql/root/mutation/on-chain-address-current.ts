import { GT } from "@graphql/index"
import { mapAndParseErrorForGqlResponse } from "@graphql/error-map"
import WalletId from "@graphql/types/scalar/wallet-id"
import OnChainAddressPayload from "@graphql/types/payload/on-chain-address"
import { validateIsBtcWalletForMutation } from "@graphql/helpers"
import { Wallets } from "@app"

const OnChainAddressCurrentInput = GT.Input({
  name: "OnChainAddressCurrentInput",
  fields: () => ({
    walletId: { type: GT.NonNull(WalletId) },
  }),
})

const OnChainAddressCurrentMutation = GT.Field({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(OnChainAddressPayload),
  args: {
    input: { type: GT.NonNull(OnChainAddressCurrentInput) },
  },
  resolve: async (_, args) => {
    const { walletId } = args.input
    if (walletId instanceof Error) {
      return { errors: [{ message: walletId.message }] }
    }

    const btcWalletValidated = await validateIsBtcWalletForMutation(walletId)
    if (btcWalletValidated != true) return btcWalletValidated

    const address = await Wallets.getLastOnChainAddress(walletId)
    if (address instanceof Error) {
      return { errors: [mapAndParseErrorForGqlResponse(address)] }
    }

    return {
      errors: [],
      address,
    }
  },
})

export default OnChainAddressCurrentMutation
