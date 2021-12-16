import { GT } from "@graphql/index"
import { mapError } from "@graphql/error-map"
import WalletId from "@graphql/types/scalar/wallet-id"
import OnChainAddressPayload from "@graphql/types/payload/on-chain-address"
import * as Wallets from "@app/wallets"

const OnChainAddressCurrentInput = new GT.Input({
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

    const address = await Wallets.getLastOnChainAddressByWalletPublicId(walletId)
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
