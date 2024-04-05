import PaymentSendResult from "../scalar/payment-send-result"

import { GT } from "@/graphql/index"
import IError from "@/graphql/shared/types/abstract/error"
import Transaction from "@/graphql/shared/types/object/transaction"

const PaymentSendPayload = GT.Object({
  name: "PaymentSendPayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(IError),
    },
    status: { type: PaymentSendResult },
    transaction: { type: Transaction },
  }),
})

export default PaymentSendPayload
