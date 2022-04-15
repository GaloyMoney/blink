import { Payments } from "@app"
import { normalizePaymentAmount } from "@domain/payments"

import { GT } from "@graphql/index"
import WalletId from "@graphql/types/scalar/wallet-id"
import SatAmount from "@graphql/types/scalar/sat-amount"
import SatAmountPayload from "@graphql/types/payload/sat-amount"
import LnPaymentRequest from "@graphql/types/scalar/ln-payment-request"
import { mapError } from "@graphql/error-map"
import { validateIsBtcWalletForMutation } from "@graphql/helpers"

const LnNoAmountInvoiceFeeProbeInput = GT.Input({
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

    const btcWalletValidated = await validateIsBtcWalletForMutation(walletId)
    if (btcWalletValidated != true) return btcWalletValidated

    const feeSatAmount = await Payments.getNoAmountLightningFeeEstimation({
      walletId,
      amount,
      paymentRequest,
    })
    if (feeSatAmount instanceof Error) {
      const appErr = mapError(feeSatAmount)
      return { errors: [{ message: appErr.message }] }
    }

    return {
      errors: [],
      amount: normalizePaymentAmount(feeSatAmount).amount,
    }
  },
})

export default LnNoAmountInvoiceFeeProbeMutation
