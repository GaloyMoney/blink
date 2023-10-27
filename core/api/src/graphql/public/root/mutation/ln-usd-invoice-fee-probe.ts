import { normalizePaymentAmount } from "../../../shared/root/mutation"

import { Payments } from "@/app"

import { GT } from "@/graphql/index"
import WalletId from "@/graphql/shared/types/scalar/wallet-id"
import CentAmountPayload from "@/graphql/public/types/payload/sat-amount"
import LnPaymentRequest from "@/graphql/shared/types/scalar/ln-payment-request"
import { mapAndParseErrorForGqlResponse } from "@/graphql/error-map"

import { checkedToWalletId } from "@/domain/wallets"
import { PartialResultType } from "@/app/partial-result"

const LnUsdInvoiceFeeProbeInput = GT.Input({
  name: "LnUsdInvoiceFeeProbeInput",
  fields: () => ({
    walletId: { type: GT.NonNull(WalletId) },
    paymentRequest: { type: GT.NonNull(LnPaymentRequest) },
  }),
})

const LnUsdInvoiceFeeProbeMutation = GT.Field<
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
  type: GT.NonNull(CentAmountPayload),
  args: {
    input: { type: GT.NonNull(LnUsdInvoiceFeeProbeInput) },
  },
  resolve: async (_, args) => {
    const { walletId, paymentRequest } = args.input

    if (walletId instanceof Error) {
      return { errors: [{ message: walletId.message }] }
    }

    if (paymentRequest instanceof Error) {
      return { errors: [{ message: paymentRequest.message }] }
    }

    const walletIdChecked = checkedToWalletId(walletId)
    if (walletIdChecked instanceof Error)
      return { errors: [mapAndParseErrorForGqlResponse(walletIdChecked)] }

    const {
      result: feeSatAmount,
      error,
      type,
    } = await Payments.getLightningFeeEstimationForUsdWallet({
      walletId,
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

export default LnUsdInvoiceFeeProbeMutation
