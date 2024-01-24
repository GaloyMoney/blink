import { InvalidFeeProbeStateError } from "@domain/bitcoin/lightning"

// import { Payments } from "@app"

import { GT } from "@graphql/index"
import WalletId from "@graphql/shared/types/scalar/wallet-id"
import CentAmount from "@graphql/public/types/scalar/cent-amount"
import CentAmountPayload from "@graphql/public/types/payload/cent-amount"
import LnPaymentRequest from "@graphql/shared/types/scalar/ln-payment-request"
import { mapAndParseErrorForGqlResponse } from "@graphql/error-map"

import { normalizePaymentAmount } from "../../../shared/root/mutation"

// FLASH FORK: import ibex dependencies
import Ibex from "@services/ibex"
import { IbexEventError } from "@services/ibex/errors"

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

    // FLASH FORK: create IBEX fee estimation instead of Galoy fee estimation
    // const { result: feeSatAmount, error } =
    //   await Payments.getNoAmountLightningFeeEstimationForUsdWallet({
    //     walletId,
    //     amount,
    //     uncheckedPaymentRequest: paymentRequest,
    //   })

    // TODO: Move Ibex call to Payments interface
    const resp: any | IbexEventError = await Ibex.getFeeEstimation({
      bolt11: paymentRequest,
      amount: String(amount / 100),
      currencyId: "3"
    })

    if (resp instanceof IbexEventError) {
      return {
        errors: [mapAndParseErrorForGqlResponse(resp)],
      } 
    }
    const feeSatAmount: PaymentAmount<WalletCurrency> = {
      amount: BigInt(Math.round(resp.data["data"]["amount"] * 1000)),
      currency: "USD",
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

export default LnNoAmountUsdInvoiceFeeProbeMutation
