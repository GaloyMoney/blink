import { GT } from "@graphql/index"

import IError from "../abstract/error"

import CentAmount from "../scalar/cent-amount"

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
