import { GT } from "@graphql/index"
import OnChainAddress from "../scalar/on-chain-address"

const OnChainAddressCurrent = new GT.Object({
  name: "OnChainAddressCurrent",
  fields: () => ({
    address: {
      type: GT.NonNull(OnChainAddress),
    },
  }),
})

export default OnChainAddressCurrent
