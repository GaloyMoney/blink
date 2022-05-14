import { GT } from "@graphql/index"

import SatAmount from "../scalar/sat-amount"

const MemoSharingSatsThreshold = GT.Object({
    name: "MemoSharingSatsThreshold",
    fields: () => ({
        amount: { type: SatAmount },
        description: "The minimum invoice amount to allow sending a memo",
    })
})

export default MemoSharingSatsThreshold
