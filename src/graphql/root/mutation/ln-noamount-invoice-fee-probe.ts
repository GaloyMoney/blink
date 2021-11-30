import { GT } from "@graphql/index"
import WalletId from "@graphql/types/scalar/wallet-id"
import SatAmount from "@graphql/types/scalar/sat-amount"
import SatAmountPayload from "@graphql/types/payload/sat-amount"
import LnPaymentRequest from "@graphql/types/scalar/ln-payment-request"
import { lnNoAmountInvoiceProbeForFee } from "@app/lightning/get-lightning-fee"
import { mapError } from "@graphql/error-map"

const LnNoAmountInvoiceFeeProbeInput = new GT.Input({
  name: "LnNoAmountInvoiceFeeProbeInput",
  fields: () => ({
    walletId: { type: GT.NonNull(WalletId) },
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
    const { walletId, paymentRequest, amount } = args.input

    for (const input of [walletId, paymentRequest, amount]) {
      if (input instanceof Error) {
        return { errors: [{ message: input.message }] }
      }
    }

    const feeSatAmount = await lnNoAmountInvoiceProbeForFee({ amount, paymentRequest })
    if (feeSatAmount instanceof Error) {
      const appErr = mapError(feeSatAmount)
      return { errors: [{ message: appErr.message }] }
    }

    // TODO: validate feeSatAmount
    return {
      errors: [],
      amount: feeSatAmount,
    }
  },
})

export default LnNoAmountInvoiceFeeProbeMutation
