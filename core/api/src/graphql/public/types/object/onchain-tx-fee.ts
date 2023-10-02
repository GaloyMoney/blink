import { GT } from "@graphql/index"

import SatAmount from "../../../shared/types/scalar/sat-amount"

const OnChainTxFee = GT.Object({
  name: "OnChainTxFee",
  fields: () => ({
    amount: { type: GT.NonNull(SatAmount) },
  }),
})

export default OnChainTxFee
