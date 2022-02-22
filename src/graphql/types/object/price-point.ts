import { GT } from "@graphql/index"

import Timestamp from "../scalar/timestamp"

import Price from "./price"

const PricePoint = GT.Object({
  name: "PricePoint",
  fields: () => ({
    timestamp: {
      type: GT.NonNull(Timestamp),
      description:
        "Unix timestamp (number of seconds elapsed since January 1, 1970 00:00:00 UTC)",
    },
    price: { type: GT.NonNull(Price) },
  }),
})

export default PricePoint
