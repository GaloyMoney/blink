import { GT } from "@graphql/index"

import { MEMO_SHARING_SATS_THRESHOLD } from "@config"

import SatAmount from "../../types/scalar/sat-amount"

const MemoSharingSatsThresholdQuery = GT.Field({
  type: SatAmount,
  resolve: () => {
    return MEMO_SHARING_SATS_THRESHOLD
  },
})

export default MemoSharingSatsThresholdQuery
