import { GT } from "@graphql/index"

import CentAmount from "../scalar/cent-amount"

const OnChainUsdTxFee = GT.Object({
  name: "OnChainUsdTxFee",
  fields: () => ({
    amount: { type: GT.NonNull(CentAmount) },
  }),
})

export default OnChainUsdTxFee
