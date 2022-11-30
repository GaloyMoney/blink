import { GT } from "@graphql/index"

import IError from "@graphql/types/abstract/error"
import SatAmount from "@graphql/types/scalar/sat-amount"
import TargetConfirmations from "@graphql/types/scalar/target-confirmations"

const OnChainTxFeePayload = GT.Object({
  name: "OnChainTxFeePayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(IError),
    },
    amount: {
      type: SatAmount,
    },
    targetConfirmations: {
      type: TargetConfirmations,
    },
  }),
})

export default OnChainTxFeePayload
