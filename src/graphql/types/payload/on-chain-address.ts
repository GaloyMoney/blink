import { GT } from "@graphql/index"

import IError from "../abstract/error"
import OnChainAddress from "../scalar/on-chain-address"

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
