import { GT } from "@graphql/index"

import AppError from "../object/app-error"
import Price from "../object/price"

const PricePayload = GT.Object({
  name: "PricePayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(AppError),
    },
    price: {
      type: Price,
    },
  }),
})

export default PricePayload
