import { GT } from "@graphql/index"

import IPrice from "../abstract/price"
import SafeInt from "../scalar/safe-int"

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
