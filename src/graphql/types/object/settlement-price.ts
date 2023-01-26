import { GT } from "@graphql/index"

import SafeInt from "../scalar/safe-int"
import DisplayCurrencyGT from "../scalar/display-currency"

const SettlementPrice = GT.Object({
  name: "SettlementPrice",
  description:
    "Price amount expressed in base/offset. To calculate, use: `base / 10^offset`",
  fields: () => ({
    base: { type: GT.NonNull(SafeInt) },
    offset: { type: GT.NonNull(GT.Int) },
    currency: { type: GT.NonNull(DisplayCurrencyGT) },
    currencyUnit: { type: GT.NonNull(GT.String) },
    formattedAmount: { type: GT.NonNull(GT.String) },
  }),
})

export default SettlementPrice
