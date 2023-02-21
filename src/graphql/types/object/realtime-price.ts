import getUuidByString from "uuid-by-string"

import { GT } from "@graphql/index"

import Timestamp from "../scalar/timestamp"

import DisplayCurrencyGT from "../scalar/display-currency"

import PriceOfOneSat from "./price-of-one-sat"
import PriceOfOneUsdCent from "./price-of-one-usd-cent"

const RealtimePrice = GT.Object({
  name: "RealtimePrice",
  fields: () => ({
    id: {
      type: GT.NonNullID,
      resolve: (source) =>
        getUuidByString(`${source.timestamp}-${source.denominatorCurrency}`),
    },
    timestamp: {
      type: GT.NonNull(Timestamp),
      description:
        "Unix timestamp (number of seconds elapsed since January 1, 1970 00:00:00 UTC)",
    },
    denominatorCurrency: { type: GT.NonNull(DisplayCurrencyGT) },

    btcSatPrice: { type: GT.NonNull(PriceOfOneSat) },
    usdCentPrice: { type: GT.NonNull(PriceOfOneUsdCent) },
  }),
})

export default RealtimePrice
