import { GT } from "@graphql/index"

import SafeInt from "../scalar/safe-int"
import CurrencyUnit from "../scalar/currency-unit"

const IPrice = GT.Interface({
  name: "PriceInterface",
  fields: () => ({
    base: { type: GT.NonNull(SafeInt) },
    offset: { type: GT.NonNull(GT.Int) },
    minorUnitToMajorUnitOffset: { type: GT.NonNull(GT.Int) },
    currencyUnit: { type: GT.NonNull(CurrencyUnit) },
  }),
})

export default IPrice
