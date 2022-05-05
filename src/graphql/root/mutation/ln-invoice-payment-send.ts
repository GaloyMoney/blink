import { Payments } from "@app"
import { InputValidationError } from "@graphql/error"
import { mapError } from "@graphql/error-map"
import { GT } from "@graphql/index"
import PaymentSendPayload from "@graphql/types/payload/payment-send"
import LnPaymentRequest from "@graphql/types/scalar/ln-payment-request"
import Memo from "@graphql/types/scalar/memo"
import WalletId from "@graphql/types/scalar/wallet-id"
import dedent from "dedent"

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
  {
    input: {
      walletId: WalletId | InputValidationError
      paymentRequest: EncodedPaymentRequest | InputValidationError
      memo?: string | InputValidationError
    }
  },
  null,
  GraphQLContextForUser
>({
  type: GT.NonNull(PaymentSendPayload),
  description: dedent`Pay a lightning invoice using a balance from a wallet which is owned by the account of the current user.
  Provided wallet can be USD or BTC and must have sufficient balance to cover amount in lightning invoice.
  Returns payment status (success, failed, pending, already_paid).`,
  args: {
    input: { type: GT.NonNull(LnInvoicePaymentInput) },
  },
  resolve: async (_, args, { domainAccount, logger }) => {
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

    const status = await Payments.payInvoiceByWalletId({
      senderWalletId: walletId,
      paymentRequest,
      memo: memo ?? null,
      senderAccount: domainAccount,
      logger,
    })

    if (status instanceof Error) {
      const appErr = mapError(status)
      return { status: "failed", errors: [{ message: appErr.message }] }
    }

    return {
      errors: [],
      status: status.value,
    }
  },
})

export default LnInvoicePaymentSendMutation
