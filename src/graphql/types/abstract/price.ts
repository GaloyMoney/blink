import { GT } from "@graphql/index"

import SafeInt from "../scalar/safe-int"

const IPrice = GT.Interface({
  name: "PriceInterface",
  fields: () => ({
    base: { type: GT.NonNull(SafeInt) },
    offset: { type: GT.NonNull(GT.Int) },
    minorUnitToMajorUnitOffset: { type: GT.NonNull(GT.Int) },
    currencyUnit: {
      deprecationReason: "Deprecated in favor of minorUnitToMajorUnitOffset",
      type: GT.NonNull(GT.String),
    },
  }),
})

export default IPrice
