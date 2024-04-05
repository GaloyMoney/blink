import SafeInt from "../scalar/safe-int"

import { GT } from "@/graphql/index"

const IPrice = GT.Interface({
  name: "PriceInterface",
  fields: () => ({
    base: { type: GT.NonNull(SafeInt) },
    offset: { type: GT.NonNull(GT.Int) },
    currencyUnit: {
      deprecationReason: "Deprecated due to type renaming",
      type: GT.NonNull(GT.String),
    },
  }),
})

export default IPrice
