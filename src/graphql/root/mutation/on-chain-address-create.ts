import { GT } from "@graphql/index"
import { createOnChainAddress } from "@app/wallets"
import OnChainAddressPayload from "@graphql/types/payload/on-chain-address"

const OnChainAddressCreateMutation = GT.Field({
  type: GT.NonNull(OnChainAddressPayload),
  resolve: async (_, __, { user }) => {
    const address = await createOnChainAddress(user.id)

    if (address instanceof Error) {
      return { errors: [{ message: address.message }] }
    }

    return {
      errors: [],
      address,
    }
  },
})

export default OnChainAddressCreateMutation
