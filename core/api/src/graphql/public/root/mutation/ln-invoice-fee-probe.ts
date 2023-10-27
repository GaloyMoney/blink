import { normalizePaymentAmount } from "../../../shared/root/mutation"

import { Payments } from "@/app"

import { GT } from "@/graphql/index"
import WalletId from "@/graphql/shared/types/scalar/wallet-id"
import SatAmountPayload from "@/graphql/public/types/payload/sat-amount"
import LnPaymentRequest from "@/graphql/shared/types/scalar/ln-payment-request"
import { mapAndParseErrorForGqlResponse } from "@/graphql/error-map"
import { PartialResultType } from "@/app/partial-result"

const LnInvoiceFeeProbeInput = GT.Input({
  name: "LnInvoiceFeeProbeInput",
  fields: () => ({
    walletId: { type: GT.NonNull(WalletId) },
    paymentRequest: { type: GT.NonNull(LnPaymentRequest) },
  }),
})

const LnInvoiceFeeProbeMutation = GT.Field<
  null,
  GraphQLPublicContextAuth,
  {
    input: {
      walletId: WalletId | InputValidationError
      paymentRequest: string | InputValidationError
    }
  }
>({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(SatAmountPayload),
  args: {
    input: { type: GT.NonNull(LnInvoiceFeeProbeInput) },
  },
  resolve: async (_, args) => {
    const { walletId, paymentRequest } = args.input

    if (walletId instanceof Error) return { errors: [{ message: walletId.message }] }

    if (paymentRequest instanceof Error)
      return { errors: [{ message: paymentRequest.message }] }

    const {
      result: feeSatAmount,
      error,
      type,
    } = await Payments.getLightningFeeEstimationForBtcWallet({
      walletId,
      uncheckedPaymentRequest: paymentRequest,
    })

    if (type === PartialResultType.Partial) {
      error
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

export default LnInvoiceFeeProbeMutation
