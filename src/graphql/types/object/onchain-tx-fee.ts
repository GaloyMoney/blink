import { GT } from "@graphql/index"

import SatAmount from "../scalar/sat-amount"
import TargetConfirmations from "../scalar/target-confirmations"

const OnChainTxFee = GT.Object({
  name: "OnChainTxFee",
  fields: () => ({
    amount: { type: GT.NonNull(SatAmount) },
    targetConfirmations: { type: GT.NonNull(TargetConfirmations) },
  }),
})

export default OnChainTxFee
