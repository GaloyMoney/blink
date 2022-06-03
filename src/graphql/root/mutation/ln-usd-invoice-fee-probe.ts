import { InvalidFeeProbeStateError } from "@domain/bitcoin/lightning"

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

    const { result: feeSatAmount, error } = await Payments.getLightningFeeEstimation({
      walletId,
      paymentRequest,
    })

    if (feeSatAmount !== null && error instanceof Error) {
      return {
        errors: [{ message: mapError(error).message }],
        ...normalizePaymentAmount(feeSatAmount),
      }
    }

    if (error instanceof Error) {
      return {
        errors: [{ message: mapError(error).message }],
      }
    }

    if (feeSatAmount === null) {
      return {
        errors: [{ message: mapError(new InvalidFeeProbeStateError()).message }],
      }
    }

    return {
      errors: [],
      ...normalizePaymentAmount(feeSatAmount),
    }
  },
})

export default LnUsdInvoiceFeeProbeMutation
