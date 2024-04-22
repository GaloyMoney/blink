import OnChainAddress from "../../../shared/types/scalar/on-chain-address"

import IError from "@/graphql/shared/types/abstract/error"
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
