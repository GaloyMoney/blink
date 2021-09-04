import { GT } from "@graphql/index"
import Timestamp from "../scalar/timestamp"

const BtcUsdPrice = new GT.Object({
  name: "BtcUsdPrice",
  fields: () => ({
    timestamp: { type: GT.NonNull(Timestamp) },
    price: { type: GT.NonNull(GT.Float) }, // Currently price of 1 sat
  }),
})

export default BtcUsdPrice
