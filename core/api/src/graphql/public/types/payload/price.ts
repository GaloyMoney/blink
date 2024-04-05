import Price from "../object/price"

import IError from "@/graphql/shared/types/abstract/error"
import { GT } from "@/graphql/index"

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
