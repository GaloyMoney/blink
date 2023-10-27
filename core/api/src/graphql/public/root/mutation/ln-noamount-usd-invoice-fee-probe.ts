import { normalizePaymentAmount } from "../../../shared/root/mutation"

import { Payments } from "@/app"

import { GT } from "@/graphql/index"
import WalletId from "@/graphql/shared/types/scalar/wallet-id"
import CentAmount from "@/graphql/public/types/scalar/cent-amount"
import CentAmountPayload from "@/graphql/public/types/payload/cent-amount"
import LnPaymentRequest from "@/graphql/shared/types/scalar/ln-payment-request"
import { mapAndParseErrorForGqlResponse } from "@/graphql/error-map"
import { PartialResultType } from "@/app/partial-result"

const LnNoAmountUsdInvoiceFeeProbeInput = GT.Input({
  name: "LnNoAmountUsdInvoiceFeeProbeInput",
  fields: () => ({
    walletId: { type: GT.NonNull(WalletId) },
    paymentRequest: { type: GT.NonNull(LnPaymentRequest) },
    amount: { type: GT.NonNull(CentAmount) },
  }),
})

const LnNoAmountUsdInvoiceFeeProbeMutation = GT.Field({
  extensions: {
    complexity: 120,
  },
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

    const {
      result: feeSatAmount,
      error,
      type,
    } = await Payments.getNoAmountLightningFeeEstimationForUsdWallet({
      walletId,
      amount,
      uncheckedPaymentRequest: paymentRequest,
    })

    if (type === PartialResultType.Partial) {
      return {
        errors: [mapAndParseErrorForGqlResponse(error)],
        ...normalizePaymentAmount(feeSatAmount),
      }
    }

    if (type === PartialResultType.Err) {
      return {
        errors: [mapAndParseErrorForGqlResponse(error)],
      }
    }

    return {
      errors: [],
      ...normalizePaymentAmount(feeSatAmount),
    }
  },
})

export default LnNoAmountUsdInvoiceFeeProbeMutation
