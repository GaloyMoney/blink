import { GT } from "@graphql/index"
import * as Wallets from "@app/wallets"
import OnChainAddressCurrent from "@graphql/types/object/onchain-address-current"

const OnChainAddressCurrentQuery = GT.Field({
  type: OnChainAddressCurrent,
  resolve: async (_, __, { user }) => {
    const address = await Wallets.getLastOnChainAddress(user.id)
    if (address instanceof Error) throw address

    return {
      address,
    }
  },
})

export default OnChainAddressCurrentQuery
