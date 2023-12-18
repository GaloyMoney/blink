import SatAmount from "../../../shared/types/scalar/sat-amount"

import { GT } from "@/graphql/index"

const OnChainTxFee = GT.Object({
  name: "OnChainTxFee",
  fields: () => ({
    amount: { type: GT.NonNull(SatAmount) },
  }),
})

export default OnChainTxFee
