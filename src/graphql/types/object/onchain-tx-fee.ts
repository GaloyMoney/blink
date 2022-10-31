import { GT } from "@graphql/index"

import IError from "../abstract/error"

import SatAmount from "../scalar/sat-amount"
import TargetConfirmations from "../scalar/target-confirmations"

const OnChainTxFee = GT.Object({
  name: "OnChainTxFee",
  fields: () => ({
    errors: {
      type: GT.NonNullList(IError),
    },
    amount: { type: SatAmount },
    targetConfirmations: { type: TargetConfirmations },
  }),
})

export default OnChainTxFee
