import { GT } from "@graphql/index"

import SatAmount from "../scalar/sat-amount"

const MemoSharingSatsThreshold = GT.Object({
  name: "MemoSharingSatsThreshold",
  fields: () => ({
    amount: { type: SatAmount },
  }),
})

export default MemoSharingSatsThreshold
