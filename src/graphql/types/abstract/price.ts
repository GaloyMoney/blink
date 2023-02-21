import { GT } from "@graphql/index"

import SafeInt from "../scalar/safe-int"

const IPrice = GT.Interface({
  name: "PriceInterface",
  fields: () => ({
    base: { type: GT.NonNull(SafeInt) },
    offset: { type: GT.NonNull(GT.Int) },
    currencyUnit: { type: GT.NonNull(GT.String) },
  }),
})

export default IPrice
