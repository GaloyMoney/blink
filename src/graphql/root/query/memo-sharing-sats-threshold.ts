import { GT } from "@graphql/index"

import SatAmount from "../../types/scalar/sat-amount"
import { MEMO_SHARING_SATS_THRESHOLD } from "@config"

const MemoSharingSatsThresholdQuery = GT.Field({
    type: SatAmount,
    resolve: () => {
        return MEMO_SHARING_SATS_THRESHOLD
    }
})

export default MemoSharingSatsThresholdQuery
