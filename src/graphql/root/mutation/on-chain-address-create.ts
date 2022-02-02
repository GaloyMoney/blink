import { GT } from "@graphql/index"
import { Wallets } from "@app"
import OnChainAddressPayload from "@graphql/types/payload/on-chain-address"
import WalletId from "@graphql/types/scalar/wallet-id"
import { mapError } from "@graphql/error-map"

const OnChainAddressCreateInput = GT.Input({
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
  resolve: async (_, args) => {
    const { walletId } = args.input
    if (walletId instanceof Error) {
      return { errors: [{ message: walletId.message }] }
    }

    const address = await Wallets.createOnChainAddress(walletId)
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
