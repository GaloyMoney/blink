import { GT } from "@graphql/index"

import IError from "../abstract/error"

const PricePayload = new GT.Object({
  name: "PricePayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(IError),
    },
    price: {
      type: GT.Float,
    },
  }),
})

export default PricePayload
