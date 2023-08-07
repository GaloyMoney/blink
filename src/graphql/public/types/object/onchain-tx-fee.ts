import { GT } from "@graphql/index"

import SatAmount from "../../../shared/types/scalar/sat-amount"
import TargetConfirmations from "../scalar/target-confirmations"

const OnChainTxFee = GT.Object({
  name: "OnChainTxFee",
  fields: () => ({
    amount: { type: GT.NonNull(SatAmount) },
    targetConfirmations: {
      deprecationReason: "Ignored - will be removed",
      type: GT.NonNull(TargetConfirmations),
    },
  }),
})

export default OnChainTxFee
