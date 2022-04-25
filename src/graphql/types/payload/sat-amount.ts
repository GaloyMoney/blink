import { GT } from "@graphql/index"

import IError from "@graphql/types/abstract/error"
import SatAmount from "@graphql/types/scalar/sat-amount"

const SatAmountPayload = GT.Object({
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
