import { GT } from "@graphql/index"
import WalletId from "@graphql/types/scalar/wallet-id"
import SatAmountPayload from "@graphql/types/payload/sat-amount"
import LnPaymentRequest from "@graphql/types/scalar/ln-payment-request"
import { Wallets } from "@app"
import { mapError } from "@graphql/error-map"

const LnInvoiceFeeProbeInput = GT.Input({
  name: "LnInvoiceFeeProbeInput",
  fields: () => ({
    walletId: { type: GT.NonNull(WalletId) },
    paymentRequest: { type: GT.NonNull(LnPaymentRequest) },
  }),
})

const LnInvoiceFeeProbeMutation = GT.Field({
  type: GT.NonNull(SatAmountPayload),
  args: {
    input: { type: GT.NonNull(LnInvoiceFeeProbeInput) },
  },
  resolve: async (_, args) => {
    const { walletId, paymentRequest } = args.input

    for (const input of [walletId, paymentRequest]) {
      if (input instanceof Error) {
        return { errors: [{ message: input.message }] }
      }
    }

    const feeSatAmount = await Wallets.getLightningFee({
      walletId,
      paymentRequest,
    })
    if (feeSatAmount instanceof Error) {
      const appErr = mapError(feeSatAmount)
      return { errors: [{ message: appErr.message }] }
    }

    return {
      errors: [],
      amount: feeSatAmount,
    }
  },
})

export default LnInvoiceFeeProbeMutation
