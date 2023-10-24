import { GT } from "@graphql/index"
import { mapAndParseErrorForGqlResponse } from "@graphql/error-map"
import Memo from "@graphql/shared/types/scalar/memo"
import WalletId from "@graphql/shared/types/scalar/wallet-id"
// import { Payments } from "@app"
import PaymentSendPayload from "@graphql/public/types/payload/payment-send"
import LnIPaymentRequest from "@graphql/shared/types/scalar/ln-payment-request"
import { InputValidationError } from "@graphql/error"
import CentAmount from "@graphql/public/types/scalar/cent-amount"
import dedent from "dedent"

// FLASH FORK: import ibex dependencies
import { PaymentSendStatus } from "@domain/bitcoin/lightning"

import { IbexRoutes } from "../../../../services/IbexHelper/Routes"

import { requestIBexPlugin } from "../../../../services/IbexHelper/IbexHelper"

const LnNoAmountUsdInvoicePaymentInput = GT.Input({
  name: "LnNoAmountUsdInvoicePaymentInput",
  fields: () => ({
    walletId: {
      type: GT.NonNull(WalletId),
      description:
        "Wallet ID with sufficient balance to cover amount defined in mutation request.  Must belong to the account of the current user.",
    },
    paymentRequest: {
      type: GT.NonNull(LnIPaymentRequest),
      description: "Payment request representing the invoice which is being paid.",
    },
    amount: { type: GT.NonNull(CentAmount), description: "Amount to pay in USD cents." },
    memo: {
      type: Memo,
      description: "Optional memo to associate with the lightning invoice.",
    },
  }),
})

const LnNoAmountUsdInvoicePaymentSendMutation = GT.Field<
  null,
  GraphQLPublicContextAuth,
  {
    input: {
      walletId: WalletId | InputValidationError
      paymentRequest: string | InputValidationError
      amount: Satoshis | InputValidationError
      memo?: string | InputValidationError
    }
  }
>({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(PaymentSendPayload),
  description: dedent`Pay a lightning invoice using a balance from a wallet which is owned by the account of the current user.
  Provided wallet must be USD and have sufficient balance to cover amount specified in mutation request.
  Returns payment status (success, failed, pending, already_paid).`,
  args: {
    input: { type: GT.NonNull(LnNoAmountUsdInvoicePaymentInput) },
  },
  resolve: async (_, args, { domainAccount }) => {
    const { walletId, paymentRequest, amount, memo } = args.input

    if (walletId instanceof InputValidationError) {
      return { errors: [{ message: walletId.message }] }
    }
    if (paymentRequest instanceof InputValidationError) {
      return { errors: [{ message: paymentRequest.message }] }
    }
    if (amount instanceof InputValidationError) {
      return { errors: [{ message: amount.message }] }
    }
    if (memo instanceof InputValidationError) {
      return { errors: [{ message: memo.message }] }
    }

    // FLASH FORK: create IBEX invoice instead of Galoy invoice
    // const status = await Payments.payNoAmountInvoiceByWalletIdForUsdWallet({
    //   senderWalletId: walletId,
    //   uncheckedPaymentRequest: paymentRequest,
    //   memo: memo ?? null,
    //   amount,
    //   senderAccount: domainAccount,
    // })
    if (!domainAccount) throw new Error("Authentication required")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let status: PaymentSendStatus | undefined = undefined
    const PayLightningInvoice = await requestIBexPlugin(
      "POST",
      IbexRoutes.LightningInvoicePayment,
      {},
      {
        bolt11: paymentRequest,
        accountId: walletId,
        amount: amount / 100,
      },
    )

    if (
      PayLightningInvoice &&
      PayLightningInvoice.data &&
      PayLightningInvoice.data["data"]["transaction"] &&
      PayLightningInvoice.data["data"]["transaction"]["payment"] &&
      PayLightningInvoice.data["data"]["transaction"]["payment"]["status"]
    ) {
      switch (
        PayLightningInvoice.data["data"]["transaction"]["payment"]["status"]["id"]
      ) {
        case 1:
          status = PaymentSendStatus.Pending
          break
        case 2:
          status = PaymentSendStatus.Success
          break
        case 3:
          status = PaymentSendStatus.Failure
          break
        default:
          status = PaymentSendStatus.Pending
          break
      }
      if (status instanceof Error) {
        return { status: "failed", errors: [mapAndParseErrorForGqlResponse(status)] }
      }

      return {
        errors: [],
        status: status.value,
      }
    }
  },
})

export default LnNoAmountUsdInvoicePaymentSendMutation
