import { GT } from "@graphql/index"

import AppError from "@graphql/types/object/app-error"
import SatAmount from "@graphql/types/scalar/sat-amount"

const SatAmountPayload = GT.Object({
  name: "SatAmountPayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(AppError),
    },
    amount: {
      type: SatAmount,
    },
  }),
})

export default SatAmountPayload
