import { GT } from "@graphql/index"

import Timestamp from "../scalar/timestamp"
import Price from "./price"

const PricePoint = new GT.Object({
  name: "PricePoint",
  fields: () => ({
    timestamp: { type: GT.NonNull(Timestamp) },
    price: { type: GT.NonNull(Price) },
  }),
})

export default PricePoint
