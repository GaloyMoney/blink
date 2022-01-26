import { GT } from "@graphql/index"

import IError from "../abstract/error"
import Price from "../object/price"

const PricePayload = GT.Object({
  name: "PricePayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(IError),
    },
    price: {
      type: Price,
    },
  }),
})

export default PricePayload
