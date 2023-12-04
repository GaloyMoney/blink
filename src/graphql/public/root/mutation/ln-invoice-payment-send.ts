// import { Payments } from "@app"
import { InputValidationError } from "@graphql/error"
import { mapAndParseErrorForGqlResponse } from "@graphql/error-map"
import { GT } from "@graphql/index"
import PaymentSendPayload from "@graphql/public/types/payload/payment-send"
import LnPaymentRequest from "@graphql/shared/types/scalar/ln-payment-request"
import Memo from "@graphql/shared/types/scalar/memo"
import WalletId from "@graphql/shared/types/scalar/wallet-id"
import dedent from "dedent"

// FLASH FORK: import ibex dependencies
import { PaymentSendStatus } from "@domain/bitcoin/lightning"

import { IbexRoutes } from "../../../../services/IbexHelper/Routes"

import { requestIBexPlugin } from "../../../../services/IbexHelper/IbexHelper"

const LnInvoicePaymentInput = GT.Input({
  name: "LnInvoicePaymentInput",
  fields: () => ({
    walletId: {
      type: GT.NonNull(WalletId),
      description:
        "Wallet ID with sufficient balance to cover amount of invoice.  Must belong to the account of the current user.",
    },
    paymentRequest: {
      type: GT.NonNull(LnPaymentRequest),
      description: "Payment request representing the invoice which is being paid.",
    },
    memo: {
      type: Memo,
      description: "Optional memo to associate with the lightning invoice.",
    },
  }),
})

const LnInvoicePaymentSendMutation = GT.Field<
  null,
  GraphQLPublicContextAuth,
  {
    input: {
      walletId: WalletId | InputValidationError
      paymentRequest: string | InputValidationError
      memo?: string | InputValidationError
    }
  }
>({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(PaymentSendPayload),
  description: dedent`Pay a lightning invoice using a balance from a wallet which is owned by the account of the current user.
  Provided wallet can be USD or BTC and must have sufficient balance to cover amount in lightning invoice.
  Returns payment status (success, failed, pending, already_paid).`,
  args: {
    input: { type: GT.NonNull(LnInvoicePaymentInput) },
  },
  resolve: async (_, args, { domainAccount }) => {
    const { walletId, paymentRequest, memo } = args.input
    if (walletId instanceof InputValidationError) {
      return { errors: [{ message: walletId.message }] }
    }
    if (paymentRequest instanceof InputValidationError) {
      return { errors: [{ message: paymentRequest.message }] }
    }
    if (memo instanceof InputValidationError) {
      return { errors: [{ message: memo.message }] }
    }

    // FLASH FORK: create IBEX invoice instead of Galoy invoice
    // const status = await Payments.payInvoiceByWalletId({
    //   senderWalletId: walletId,
    //   uncheckedPaymentRequest: paymentRequest,
    //   memo: memo ?? null,
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
      },
    )

    // Check for the specific error and handle it
    if (
      PayLightningInvoice &&
      PayLightningInvoice.data &&
      PayLightningInvoice.data["error"] == "'daily limit exceeded'"
    ) {
      return {
        status: "failed",
        errors: [
          {
            message:
              "Daily transaction limit has been exceeded. Please try again tomorrow.",
          },
        ],
      }
    }
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
        errors: [
          {
            message:
              "Daily transaction limit has been exceeded. Please try again tomorrow.",
          },
        ],
        status: status.value,
      }
    }
    // Fallback error if no conditions met
    return {
      status: "failed",
      errors: [{ message: "An unexpected error occurred. Please try again later." }],
    }
  },
})

export default LnInvoicePaymentSendMutation
