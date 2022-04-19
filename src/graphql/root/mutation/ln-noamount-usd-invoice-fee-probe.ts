import { Payments } from "@app"
import { normalizePaymentAmount } from "@domain/payments"

import { GT } from "@graphql/index"
import WalletId from "@graphql/types/scalar/wallet-id"
import CentAmount from "@graphql/types/scalar/cent-amount"
import CentAmountPayload from "@graphql/types/payload/cent-amount"
import LnPaymentRequest from "@graphql/types/scalar/ln-payment-request"
import { mapError } from "@graphql/error-map"
import { validateIsUsdWalletForMutation } from "@graphql/helpers"

const LnNoAmountUsdInvoiceFeeProbeInput = GT.Input({
  name: "LnNoAmountUsdInvoiceFeeProbeInput",
  fields: () => ({
    walletId: { type: GT.NonNull(WalletId) },
    paymentRequest: { type: GT.NonNull(LnPaymentRequest) },
    amount: { type: GT.NonNull(CentAmount) },
  }),
})

const LnNoAmountUsdInvoiceFeeProbeMutation = GT.Field({
  type: GT.NonNull(CentAmountPayload),
  args: {
    input: { type: GT.NonNull(LnNoAmountUsdInvoiceFeeProbeInput) },
  },
  resolve: async (_, args) => {
    const { walletId, paymentRequest, amount } = args.input

    for (const input of [walletId, paymentRequest, amount]) {
      if (input instanceof Error) {
        return { errors: [{ message: input.message }] }
      }
    }

    const usdWalletValidated = await validateIsUsdWalletForMutation(walletId)
    if (usdWalletValidated != true) return usdWalletValidated

    const feeUsdAmount = await Payments.getNoAmountLightningFeeEstimation({
      walletId,
      amount,
      paymentRequest,
    })
    if (feeUsdAmount instanceof Error) {
      const appErr = mapError(feeUsdAmount)
      return { errors: [{ message: appErr.message }] }
    }

    return {
      errors: [],
      amount: normalizePaymentAmount(feeUsdAmount).amount,
    }
  },
})

export default LnNoAmountUsdInvoiceFeeProbeMutation
