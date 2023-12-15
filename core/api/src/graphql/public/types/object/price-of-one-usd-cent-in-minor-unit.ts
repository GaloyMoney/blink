import IPrice from "../../../shared/types/abstract/price"
import SafeInt from "../../../shared/types/scalar/safe-int"

import { GT } from "@/graphql/index"

const PriceOfOneUsdCentInMinorUnit = GT.Object({
  name: "PriceOfOneUsdCentInMinorUnit",
  interfaces: () => [IPrice],
  description:
    "Price of 1 usd cent in base/offset. To calculate, use: `base / 10^offset`",
  fields: () => ({
    base: { type: GT.NonNull(SafeInt) },
    offset: { type: GT.NonNull(GT.Int) },
    currencyUnit: {
      deprecationReason: "Deprecated due to type renaming",
      type: GT.NonNull(GT.String),
    },
  }),
})

export default PriceOfOneUsdCentInMinorUnit
