import { GT } from "@graphql/index"
import IError from "../abstract/error"

import SatAmount from "../scalar/sat-amount"

const SatAmountPayload = new GT.Object({
  name: "SatAmountPayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(IError),
    },
    amount: {
      type: SatAmount,
    },
  }),
})

export default SatAmountPayload
