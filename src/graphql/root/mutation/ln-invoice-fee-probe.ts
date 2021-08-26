import { GT } from "@graphql/index"

import LnInvoicePaymentRequest from "@graphql/types/scalar/ln-invoice-payment-request"
import SatAmountPayload from "@graphql/types/payload/sat-amount"

const LnInvoiceFeeProbeInput = new GT.Input({
  name: "LnInvoiceFeeProbeInput",
  fields: () => ({
    paymentRequest: { type: GT.NonNull(LnInvoicePaymentRequest) },
  }),
})

const LnInvoiceFeeProbeMutation = GT.Field({
  type: GT.NonNull(SatAmountPayload),
  args: {
    input: { type: GT.NonNull(LnInvoiceFeeProbeInput) },
  },
  resolve: async (_, args, { wallet }) => {
    const { paymentRequest } = args.input

    if (paymentRequest instanceof Error) {
      return { errors: [{ message: paymentRequest.message }] }
    }

    try {
      const feeSatAmount = wallet.getLightningFee({
        invoice: paymentRequest,
      })
      // TODO: validate feeSatAmount
      return {
        errors: [],
        amount: feeSatAmount,
      }
    } catch (err) {
      return { errors: [{ message: err.message }] }
    }
  },
})

export default LnInvoiceFeeProbeMutation
