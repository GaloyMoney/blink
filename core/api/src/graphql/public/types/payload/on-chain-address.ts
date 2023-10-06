import IError from "../../../shared/types/abstract/error"
import OnChainAddress from "../../../shared/types/scalar/on-chain-address"

import { GT } from "@/graphql/index"

const OnChainAddressPayload = GT.Object({
  name: "OnChainAddressPayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(IError),
    },
    address: {
      type: OnChainAddress,
    },
  }),
})

export default OnChainAddressPayload
