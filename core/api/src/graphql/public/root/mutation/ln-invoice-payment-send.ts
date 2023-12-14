import dedent from "dedent"

import { Payments } from "@/app"
import { InputValidationError } from "@/graphql/error"
import { mapAndParseErrorForGqlResponse } from "@/graphql/error-map"
import { GT } from "@/graphql/index"
import PaymentSendPayload from "@/graphql/public/types/payload/payment-send"
import LnPaymentRequest from "@/graphql/shared/types/scalar/ln-payment-request"
import Memo from "@/graphql/shared/types/scalar/memo"
import WalletId from "@/graphql/shared/types/scalar/wallet-id"

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

    const result = await Payments.payInvoiceByWalletId({
      senderWalletId: walletId,
      uncheckedPaymentRequest: paymentRequest,
      memo: memo ?? null,
      senderAccount: domainAccount,
    })

    if (result instanceof Error) {
      return { status: "failed", errors: [mapAndParseErrorForGqlResponse(result)] }
    }

    return {
      errors: [],
      status: result.status.value,
      transaction: result.transaction,
    }
  },
})

export default LnInvoicePaymentSendMutation
