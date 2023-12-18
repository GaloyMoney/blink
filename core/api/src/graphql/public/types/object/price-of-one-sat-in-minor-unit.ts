import IPrice from "../../../shared/types/abstract/price"
import SafeInt from "../../../shared/types/scalar/safe-int"

import { GT } from "@/graphql/index"

const PriceOfOneSatInMinorUnit = GT.Object({
  name: "PriceOfOneSatInMinorUnit",
  interfaces: () => [IPrice],
  description: "Price of 1 sat in base/offset. To calculate, use: `base / 10^offset`",
  fields: () => ({
    base: { type: GT.NonNull(SafeInt) },
    offset: { type: GT.NonNull(GT.Int) },
    currencyUnit: {
      deprecationReason: "Deprecated due to type renaming",
      type: GT.NonNull(GT.String),
    },
  }),
})

export default PriceOfOneSatInMinorUnit
