import { GT } from "@graphql/index"
import * as Wallets from "@app/wallets"
import OnChainAddressPayload from "@graphql/types/payload/on-chain-address"

const OnChainAddressCurrentMutation = GT.Field({
  type: GT.NonNull(OnChainAddressPayload),
  resolve: async (_, __, { user }) => {
    const address = await Wallets.getLastOnChainAddress(user.id)

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
