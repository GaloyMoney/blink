import { GT } from "@graphql/index"
// import ExpectedConfirmationTime from "../scalar/expected-confirmation-time"
import SatAmount from "../scalar/sat-amount"

const OnChainTxFee = new GT.Object({
  name: "OnChainTxFee",
  fields: () => ({
    amount: { type: GT.NonNull(SatAmount) },
    // expectedConfirmationTime: { type: GT.NonNull(ExpectedConfirmationTime) },
  }),
})

export default OnChainTxFee
