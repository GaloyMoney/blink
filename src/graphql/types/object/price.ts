import { GT } from "@graphql/index"
import BigInt from "../scalar/big-int"

import ExchangeCurrencyUnit from "../scalar/exchange-currency-unit"

const Price = new GT.Object({
  name: "Price",
  fields: () => ({
    base: { type: GT.NonNull(BigInt) },
    offset: { type: GT.NonNull(GT.Int) },
    currencyUnit: { type: GT.NonNull(ExchangeCurrencyUnit) },
    formattedAmount: { type: GT.NonNull(GT.String) },
  }),
})

export default Price
