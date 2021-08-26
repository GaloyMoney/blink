import { TxStatus } from "@domain/wallets"
import { GT } from "@graphql/index"
import LnInvoicePaymentStatusPayload from "@graphql/types/payload/ln-invoice-payment-status"
import LnInvoicePaymentRequest from "@graphql/types/scalar/ln-invoice-payment-request"
import Memo from "@graphql/types/scalar/memo"

const LnInvoicePaymentInput = new GT.Input({
  name: "LnInvoicePaymentInput",
  fields: () => ({
    paymentRequest: { type: GT.NonNull(LnInvoicePaymentRequest) },
    memo: { type: Memo },
  }),
})

const lnInvoicePaymentSendMutation = GT.Field({
  type: GT.NonNull(LnInvoicePaymentStatusPayload),
  args: {
    input: { type: GT.NonNull(LnInvoicePaymentInput) },
  },
  resolve: async (_, __, { wallet, paymentRequest, memo }) => {
    for (const input of [memo, paymentRequest]) {
      if (input instanceof Error) {
        return { errors: [{ message: input.message }] }
      }
    }

    try {
      const payReturn = await wallet.pay({ invoice: paymentRequest, memo })
      const status = payReturn == "pending" ? TxStatus.Pending : TxStatus.Success
      return {
        errors: [],
        status,
      }
    } catch (err) {
      return {
        errors: [{ message: err.message }],
      }
    }
  },
})

export default lnInvoicePaymentSendMutation
