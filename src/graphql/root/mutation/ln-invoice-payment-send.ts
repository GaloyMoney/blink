import { GT } from "@graphql/index"
import LnInvoicePaymentSendPayload from "@graphql/types/payload/ln-invoice-payment-send-payload"
import LnPaymentRequest from "@graphql/types/scalar/ln-payment-request"
import Memo from "@graphql/types/scalar/memo"

const LnInvoicePaymentInput = new GT.Input({
  name: "LnInvoicePaymentInput",
  fields: () => ({
    paymentRequest: { type: GT.NonNull(LnPaymentRequest) },
    memo: { type: Memo },
  }),
})

const LnInvoicePaymentSendMutation = GT.Field({
  type: GT.NonNull(LnInvoicePaymentSendPayload),
  args: {
    input: { type: GT.NonNull(LnInvoicePaymentInput) },
  },
  resolve: async (_, args, { wallet }) => {
    const { paymentRequest, memo } = args.input

    for (const input of [memo, paymentRequest]) {
      if (input instanceof Error) {
        return { errors: [{ message: input.message }] }
      }
    }

    try {
      const status = await wallet.pay({ invoice: paymentRequest, memo })
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

export default LnInvoicePaymentSendMutation
