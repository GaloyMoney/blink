import getUuidByString from "uuid-by-string"

import { GT } from "@graphql/index"

import SafeInt from "../scalar/safe-int"
import Timestamp from "../scalar/timestamp"
import WalletCurrencyGT from "../scalar/wallet-currency"
import DisplayCurrencyGT from "../scalar/display-currency"

const RealtimePrice = GT.Object({
  name: "RealtimePrice",
  description:
    "Price amount expressed in base/offset. To calculate, use: `base / 10^offset`",
  fields: () => ({
    id: {
      type: GT.NonNullID,
      resolve: (source) =>
        getUuidByString(
          `${source.timestamp}-${source.walletCurrency}-${source.displayCurrency}`,
        ),
    },
    timestamp: {
      type: GT.NonNull(Timestamp),
      description:
        "Unix timestamp (number of seconds elapsed since January 1, 1970 00:00:00 UTC)",
    },
    base: { type: GT.NonNull(SafeInt) },
    offset: { type: GT.NonNull(GT.Int) },
    walletCurrency: { type: GT.NonNull(WalletCurrencyGT) },
    displayCurrency: { type: GT.NonNull(DisplayCurrencyGT) },
    currencyUnit: { type: GT.NonNull(GT.String) },
    formattedAmount: { type: GT.NonNull(GT.String) },
  }),
})

export default RealtimePrice
