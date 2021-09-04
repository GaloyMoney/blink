import { GT } from "@graphql/index"
import IError from "../abstract/error"

import BtcUsdPrice from "../object/btc-usd-price"

const BtcUsdPriceListForGraphPayload = new GT.Object({
  name: "BtcUsdPriceListForGraphPayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(IError),
    },
    btcUsdPriceList: {
      type: BtcUsdPrice,
    },
  }),
})

export default BtcUsdPriceListForGraphPayload
