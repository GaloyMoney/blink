import { GT } from "@graphql/index"

import LnPaymentRequest from "@graphql/types/scalar/ln-payment-request"
import SatAmountPayload from "@graphql/types/payload/sat-amount"
import { lnInvoiceFeeProbe } from "@app/lightning/get-lightning-fee"

const LnInvoiceFeeProbeInput = new GT.Input({
  name: "LnInvoiceFeeProbeInput",
  fields: () => ({
    paymentRequest: { type: GT.NonNull(LnPaymentRequest) },
  }),
})

const LnInvoiceFeeProbeMutation = GT.Field({
  type: GT.NonNull(SatAmountPayload),
  args: {
    input: { type: GT.NonNull(LnInvoiceFeeProbeInput) },
  },
  resolve: async (_, args) => {
    const { paymentRequest } = args.input

    if (paymentRequest instanceof Error) {
      return { errors: [{ message: paymentRequest.message }] }
    }

    try {
      const feeSatAmount = await lnInvoiceFeeProbe({
        paymentRequest,
      })
      if (feeSatAmount instanceof Error) {
        return { errors: [{ message: feeSatAmount.message || feeSatAmount.name }] } // TODO: refine error
      }

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
