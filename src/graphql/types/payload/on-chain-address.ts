import { GT } from "@graphql/index"

import AppError from "../object/app-error"
import OnChainAddress from "../scalar/on-chain-address"

const OnChainAddressPayload = GT.Object({
  name: "OnChainAddressPayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(AppError),
    },
    address: {
      type: OnChainAddress,
    },
  }),
})

export default OnChainAddressPayload
