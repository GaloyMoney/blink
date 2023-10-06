import { GT } from "@/graphql/index"

import IError from "@/graphql/shared/types/abstract/error"
import CentAmount from "@/graphql/public/types/scalar/cent-amount"

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
