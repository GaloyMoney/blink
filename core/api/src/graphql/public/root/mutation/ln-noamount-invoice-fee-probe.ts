import { normalizePaymentAmount } from "../../../shared/root/mutation"

import { InvalidFeeProbeStateError } from "@/domain/bitcoin/lightning"

import { Payments } from "@/app"

import { GT } from "@/graphql/index"
import WalletId from "@/graphql/shared/types/scalar/wallet-id"
import SatAmount from "@/graphql/shared/types/scalar/sat-amount"
import SatAmountPayload from "@/graphql/public/types/payload/sat-amount"
import LnPaymentRequest from "@/graphql/shared/types/scalar/ln-payment-request"
import { mapAndParseErrorForGqlResponse } from "@/graphql/error-map"

const LnNoAmountInvoiceFeeProbeInput = GT.Input({
  name: "LnNoAmountInvoiceFeeProbeInput",
  fields: () => ({
    walletId: { type: GT.NonNull(WalletId) },
    paymentRequest: { type: GT.NonNull(LnPaymentRequest) },
    amount: { type: GT.NonNull(SatAmount) },
  }),
})

const LnNoAmountInvoiceFeeProbeMutation = GT.Field({
  extensions: {
    complexity: 120,
  },
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

    const { result: feeSatAmount, error } =
      await Payments.getNoAmountLightningFeeEstimationForBtcWallet({
        walletId,
        amount,
        uncheckedPaymentRequest: paymentRequest,
      })

    if (feeSatAmount !== null && error instanceof Error) {
      return {
        errors: [mapAndParseErrorForGqlResponse(error)],
        ...normalizePaymentAmount(feeSatAmount),
      }
    }

    if (error instanceof Error) {
      return {
        errors: [mapAndParseErrorForGqlResponse(error)],
      }
    }

    if (feeSatAmount === null) {
      return {
        errors: [mapAndParseErrorForGqlResponse(new InvalidFeeProbeStateError())],
      }
    }

    return {
      errors: [],
      ...normalizePaymentAmount(feeSatAmount),
    }
  },
})

export default LnNoAmountInvoiceFeeProbeMutation
