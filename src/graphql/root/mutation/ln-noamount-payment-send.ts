import { TxStatus } from "@domain/wallets"
import { GT } from "@graphql/index"
import LnInvoicePaymentStatusPayload from "@graphql/types/payload/ln-invoice-payment-status"
import LnInvoicePaymentRequest from "@graphql/types/scalar/ln-invoice-payment-request"
import Memo from "@graphql/types/scalar/memo"
import SatAmount from "@graphql/types/scalar/sat-amount"

const LnNoAmountInvoicePaymentInput = new GT.Input({
  name: "LnNoAmountInvoicePaymentInput",
  fields: () => ({
    paymentRequest: { type: GT.NonNull(LnInvoicePaymentRequest) },
    amount: { type: GT.NonNull(SatAmount) },
    memo: { type: Memo },
  }),
})

const lnNoAmountInvoicePaymentSendMutation = GT.Field({
  type: GT.NonNull(LnInvoicePaymentStatusPayload),
  args: {
    input: { type: GT.NonNull(LnNoAmountInvoicePaymentInput) },
  },
  resolve: async (_, __, { wallet, paymentRequest, amount, memo }) => {
    for (const input of [memo, amount, paymentRequest]) {
      if (input instanceof Error) {
        return { errors: [{ message: input.message }] }
      }
    }

    try {
      const payReturn = await wallet.pay({ invoice: paymentRequest, amount, memo })
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

export default lnNoAmountInvoicePaymentSendMutation
