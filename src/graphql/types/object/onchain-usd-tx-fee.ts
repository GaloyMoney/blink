import { GT } from "@graphql/index"

import CentAmount from "../scalar/cent-amount"
import TargetConfirmations from "../scalar/target-confirmations"

const OnChainUsdTxFee = GT.Object({
  name: "OnChainUsdTxFee",
  fields: () => ({
    amount: { type: GT.NonNull(CentAmount) },
    targetConfirmations: { type: GT.NonNull(TargetConfirmations) },
  }),
})

export default OnChainUsdTxFee
