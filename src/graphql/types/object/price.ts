import { GT } from "@graphql/index"

import SafeInt from "../scalar/safe-int"

import ExchangeCurrencyUnit from "../scalar/exchange-currency-unit"

const Price = GT.Object({
  name: "Price",
  description:
    "Price amount expressed in base/offset. To calculate, use: `base / 10^offset`",
  fields: () => ({
    base: { type: GT.NonNull(SafeInt) },
    offset: { type: GT.NonNull(GT.Int) },
    currencyUnit: { type: GT.NonNull(ExchangeCurrencyUnit) },
    formattedAmount: { type: GT.NonNull(GT.String) },
  }),
})

export default Price
