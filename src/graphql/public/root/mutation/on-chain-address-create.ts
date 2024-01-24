import { GT } from "@graphql/index"
import { Wallets } from "@app"
import OnChainAddressPayload from "@graphql/public/types/payload/on-chain-address"
import WalletId from "@graphql/shared/types/scalar/wallet-id"
import { mapAndParseErrorForGqlResponse } from "@graphql/error-map"

const OnChainAddressCreateInput = GT.Input({
  name: "OnChainAddressCreateInput",
  fields: () => ({
    walletId: { type: GT.NonNull(WalletId) },
  }),
})

const OnChainAddressCreateMutation = GT.Field({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(OnChainAddressPayload),
  args: {
    input: { type: GT.NonNull(OnChainAddressCreateInput) },
  },
  resolve: async (_, args) => {
    const { walletId } = args.input
    if (walletId instanceof Error) {
      return { errors: [{ message: walletId.message }] }
    }

    const address = await Wallets.createOnChainAddress({ walletId })
    if (address instanceof Error) {
      return { errors: [mapAndParseErrorForGqlResponse(address)] }
    }
    return {
      errors: [],
      address,
    }
  },
})

export default OnChainAddressCreateMutation
