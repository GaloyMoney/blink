import { GT } from "@graphql/index"

import LnPaymentRequest from "@graphql/types/scalar/ln-payment-request"
import SatAmountPayload from "@graphql/types/payload/sat-amount"
import SatAmount from "@graphql/types/scalar/sat-amount"
import { lnNoAmountInvoiceFeeProbe } from "@app/lightning/get-lightning-fee"

const LnNoAmountInvoiceFeeProbeInput = new GT.Input({
  name: "LnNoAmountInvoiceFeeProbeInput",
  fields: () => ({
    paymentRequest: { type: GT.NonNull(LnPaymentRequest) },
    amount: { type: GT.NonNull(SatAmount) },
  }),
})

const LnNoAmountInvoiceFeeProbeMutation = GT.Field({
  type: GT.NonNull(SatAmountPayload),
  args: {
    input: { type: GT.NonNull(LnNoAmountInvoiceFeeProbeInput) },
  },
  resolve: async (_, args) => {
    const { paymentRequest, amount } = args.input

    for (const input of [paymentRequest, amount]) {
      if (input instanceof Error) {
        return { errors: [{ message: input.message }] }
      }
    }

    try {
      const feeSatAmount = await lnNoAmountInvoiceFeeProbe({ amount, paymentRequest })
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

export default LnNoAmountInvoiceFeeProbeMutation
