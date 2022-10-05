import { GT } from "@graphql/index"
import { mapAndParseErrorForGqlResponse } from "@graphql/error-map"
import Memo from "@graphql/types/scalar/memo"
import WalletId from "@graphql/types/scalar/wallet-id"
import SatAmount from "@graphql/types/scalar/sat-amount"
import { Payments } from "@app"
import PaymentSendPayload from "@graphql/types/payload/payment-send"
import LnIPaymentRequest from "@graphql/types/scalar/ln-payment-request"
import { InputValidationError } from "@graphql/error"
import { validateIsBtcWalletForMutation } from "@graphql/helpers"
import dedent from "dedent"

const LnNoAmountInvoicePaymentInput = GT.Input({
  name: "LnNoAmountInvoicePaymentInput",
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
    amount: {
      type: GT.NonNull(SatAmount),
      description: "Amount to pay in satoshis.",
    },
    memo: {
      type: Memo,
      description: "Optional memo to associate with the lightning invoice.",
    },
  }),
})

const LnNoAmountInvoicePaymentSendMutation = GT.Field<
  {
    input: {
      walletId: WalletId | InputValidationError
      paymentRequest: string | InputValidationError
      amount: Satoshis | InputValidationError
      memo?: string | InputValidationError
    }
  },
  null,
  GraphQLContextForUser
>({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(PaymentSendPayload),
  description: dedent`Pay a lightning invoice using a balance from a wallet which is owned by the account of the current user.
  Provided wallet must be BTC and must have sufficient balance to cover amount specified in mutation request.
  Returns payment status (success, failed, pending, already_paid).`,
  args: {
    input: { type: GT.NonNull(LnNoAmountInvoicePaymentInput) },
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

    const btcWalletValidated = await validateIsBtcWalletForMutation(walletId)
    if (btcWalletValidated != true) return btcWalletValidated

    const status = await Payments.payNoAmountInvoiceByWalletId({
      senderWalletId: walletId,
      uncheckedPaymentRequest: paymentRequest,
      memo: memo ?? null,
      amount,
      senderAccount: domainAccount,
    })

    if (status instanceof Error) {
      return { status: "failed", errors: [mapAndParseErrorForGqlResponse(status)] }
    }

    return {
      errors: [],
      status: status.value,
    }
  },
})

export default LnNoAmountInvoicePaymentSendMutation
