import { GT } from "@graphql/index"

import IError from "@graphql/types/abstract/error"
import CentAmount from "@graphql/types/scalar/cent-amount"

const CentAmountPayload = GT.Object({
  name: "CentAmountPayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(IError),
    },
    amount: {
      type: CentAmount,
    },
  }),
})

export default CentAmountPayload
