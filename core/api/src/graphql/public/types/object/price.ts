import SafeInt from "../../../shared/types/scalar/safe-int"

import { GT } from "@/graphql/index"

const Price = GT.Object({
  name: "Price",
  description:
    "Price amount expressed in base/offset. To calculate, use: `base / 10^offset`",
  fields: () => ({
    base: { type: GT.NonNull(SafeInt) },
    offset: { type: GT.NonNull(GT.Int) },
    currencyUnit: { type: GT.NonNull(GT.String) },
    formattedAmount: { type: GT.NonNull(GT.String) },
  }),
})

export default Price
