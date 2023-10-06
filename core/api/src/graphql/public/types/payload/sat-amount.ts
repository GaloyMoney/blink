import { GT } from "@/graphql/index"

import IError from "@/graphql/shared/types/abstract/error"
import SatAmount from "@/graphql/shared/types/scalar/sat-amount"

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
