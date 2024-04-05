import CentAmount from "../scalar/cent-amount"

import { GT } from "@/graphql/index"

const OnChainUsdTxFee = GT.Object({
  name: "OnChainUsdTxFee",
  fields: () => ({
    amount: { type: GT.NonNull(CentAmount) },
  }),
})

export default OnChainUsdTxFee
