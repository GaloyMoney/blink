import { GT } from "@graphql/index"
import LnInvoicePaymentSendPayload from "@graphql/types/payload/ln-invoice-payment-send-payload"
import LnIPaymentRequest from "@graphql/types/scalar/ln-payment-request"
import Memo from "@graphql/types/scalar/memo"
import SatAmount from "@graphql/types/scalar/sat-amount"

const LnNoAmountInvoicePaymentInput = new GT.Input({
  name: "LnNoAmountInvoicePaymentInput",
  fields: () => ({
    paymentRequest: { type: GT.NonNull(LnIPaymentRequest) },
    amount: { type: GT.NonNull(SatAmount) },
    memo: { type: Memo },
  }),
})

const LnNoAmountInvoicePaymentSendMutation = GT.Field({
  type: GT.NonNull(LnInvoicePaymentSendPayload),
  args: {
    input: { type: GT.NonNull(LnNoAmountInvoicePaymentInput) },
  },
  resolve: async (_, args, { wallet }) => {
    const { paymentRequest, amount, memo } = args.input
    for (const input of [memo, amount, paymentRequest]) {
      if (input instanceof Error) {
        return { errors: [{ message: input.message }] }
      }
    }

    try {
      const status = await wallet.pay({ invoice: paymentRequest, amount, memo })
      if (status instanceof Error) {
        return { status: "failed", errors: [{ message: status.message }] }
      }
      return {
        errors: [],
        status,
      }
    } catch (err) {
      return {
        status: "failed",
        errors: [{ message: err.message }],
      }
    }
  },
})

export default LnNoAmountInvoicePaymentSendMutation
