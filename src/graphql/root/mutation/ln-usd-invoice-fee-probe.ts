import { Payments } from "@app"

import { GT } from "@graphql/index"
import WalletId from "@graphql/types/scalar/wallet-id"
import CentAmountPayload from "@graphql/types/payload/sat-amount"
import LnPaymentRequest from "@graphql/types/scalar/ln-payment-request"
import { mapError } from "@graphql/error-map"
import { validateIsUsdWalletForMutation } from "@graphql/helpers"

import { normalizePaymentAmount } from "."

const LnUsdInvoiceFeeProbeInput = GT.Input({
  name: "LnUsdInvoiceFeeProbeInput",
  fields: () => ({
    walletId: { type: GT.NonNull(WalletId) },
    paymentRequest: { type: GT.NonNull(LnPaymentRequest) },
  }),
})

const LnUsdInvoiceFeeProbeMutation = GT.Field({
  type: GT.NonNull(CentAmountPayload),
  args: {
    input: { type: GT.NonNull(LnUsdInvoiceFeeProbeInput) },
  },
  resolve: async (_, args) => {
    const { walletId, paymentRequest } = args.input

    for (const input of [walletId, paymentRequest]) {
      if (input instanceof Error) {
        return { errors: [{ message: input.message }] }
      }
    }

    const usdWalletValidated = await validateIsUsdWalletForMutation(walletId)
    if (usdWalletValidated != true) return usdWalletValidated

    const feeSatAmount = await Payments.getLightningFeeEstimation({
      walletId,
      paymentRequest,
    })
    if (feeSatAmount instanceof Error) {
      const appErr = mapError(feeSatAmount)
      return { errors: [{ message: appErr.message }] }
    }

    return {
      errors: [],
      ...normalizePaymentAmount(feeSatAmount),
    }
  },
})

export default LnUsdInvoiceFeeProbeMutation
