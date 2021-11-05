import { GT } from "@graphql/index"

import LnPaymentRequest from "@graphql/types/scalar/ln-payment-request"
import SatAmountPayload from "@graphql/types/payload/sat-amount"
import { lnInvoiceFeeProbe } from "@app/lightning/get-lightning-fee"
import { mapError } from "@graphql/error-map"

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

    const feeSatAmount = await lnInvoiceFeeProbe({
      paymentRequest,
    })
    if (feeSatAmount instanceof Error) {
      const appErr = mapError(feeSatAmount)
      return { errors: [{ message: appErr.message || appErr.name }] } // TODO: refine error
    }

    // TODO: validate feeSatAmount
    return {
      errors: [],
      amount: feeSatAmount,
    }
  },
})

export default LnInvoiceFeeProbeMutation
