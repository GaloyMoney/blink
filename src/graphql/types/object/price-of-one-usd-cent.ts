import { GT } from "@graphql/index"

import IPrice from "../abstract/price"
import SafeInt from "../scalar/safe-int"
import CurrencyUnit from "../scalar/currency-unit"

const PriceOfOneUsdCent = GT.Object({
  name: "PriceOfOneUsdCent",
  interfaces: () => [IPrice],
  description:
    "Price of 1 usd cent in base/offset. To calculate, use: `base / 10^offset`",
  fields: () => ({
    base: { type: GT.NonNull(SafeInt) },
    offset: { type: GT.NonNull(GT.Int) },
    minorUnitToMajorUnitOffset: { type: GT.NonNull(GT.Int) },
    currencyUnit: {
      deprecationReason: "Deprecated in favor of minorUnitToMajorUnitOffset",
      type: GT.NonNull(CurrencyUnit),
    },
  }),
})

export default PriceOfOneUsdCent
