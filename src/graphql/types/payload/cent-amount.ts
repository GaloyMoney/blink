import { GT } from "@graphql/index"

import AppError from "@graphql/types/object/app-error"
import CentAmount from "@graphql/types/scalar/cent-amount"

const CentAmountPayload = GT.Object({
  name: "CentAmountPayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(AppError),
    },
    amount: {
      type: CentAmount,
    },
  }),
})

export default CentAmountPayload
