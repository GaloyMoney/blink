import { InvalidFeeProbeStateError } from "@domain/bitcoin/lightning"

// import { Payments } from "@app"

import { GT } from "@graphql/index"
import WalletId from "@graphql/shared/types/scalar/wallet-id"
import SatAmountPayload from "@graphql/public/types/payload/sat-amount"
import LnPaymentRequest from "@graphql/shared/types/scalar/ln-payment-request"
import { mapAndParseErrorForGqlResponse } from "@graphql/error-map"

import { normalizePaymentAmount } from "../../../shared/root/mutation"

// FLASH FORK: import ibex dependencies
import { IbexRoutes } from "../../../../services/IbexHelper/Routes"

import { requestIBexPlugin } from "../../../../services/IbexHelper/IbexHelper"

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

    // FLASH FORK: create IBEX fee estimation instead of Galoy fee estimation
    // const { result: feeSatAmount, error } =
    //   await Payments.getLightningFeeEstimationForBtcWallet({
    //     walletId,
    //     uncheckedPaymentRequest: paymentRequest,
    //   })
    const feeSatAmount: PaymentAmount<WalletCurrency> = {
      amount: BigInt(0),
      currency: "BTC",
    }
    let error: Error | null = new Error("Unknown error")

    const feeEndpoint = `${IbexRoutes.LightningInvoicePaymentFee}${paymentRequest}`

    const PayLightningFeeInfo = await requestIBexPlugin("GET", feeEndpoint, {}, {})

    if (
      PayLightningFeeInfo.data &&
      PayLightningFeeInfo.data["data"] &&
      PayLightningFeeInfo.data["data"]["amount"]
    ) {
      feeSatAmount.amount = BigInt(
        Math.round(PayLightningFeeInfo.data["data"]["amount"] / 1000),
      )
      error = null
    }

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

export default LnInvoiceFeeProbeMutation
