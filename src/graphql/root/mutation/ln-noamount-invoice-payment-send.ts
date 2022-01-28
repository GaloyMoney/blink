import { GT } from "@graphql/index"
import { mapError } from "@graphql/error-map"
import Memo from "@graphql/types/scalar/memo"
import WalletId from "@graphql/types/scalar/wallet-id"
import SatAmount from "@graphql/types/scalar/sat-amount"
import { Wallets } from "@app"
import PaymentSendPayload from "@graphql/types/payload/payment-send"
import LnIPaymentRequest from "@graphql/types/scalar/ln-payment-request"
import { InputValidationError } from "@graphql/error"

const LnNoAmountInvoicePaymentInput = GT.Input({
  name: "LnNoAmountInvoicePaymentInput",
  fields: () => ({
    walletId: { type: GT.NonNull(WalletId) },
    paymentRequest: { type: GT.NonNull(LnIPaymentRequest) },
    amount: { type: GT.NonNull(SatAmount) },
    memo: { type: Memo },
  }),
})

const LnNoAmountInvoicePaymentSendMutation = GT.Field<
  {
    input: {
      walletId: WalletId | InputValidationError
      paymentRequest: EncodedPaymentRequest | InputValidationError
      amount: Satoshis | InputValidationError
      memo?: string | InputValidationError
    }
  },
  null,
  GraphQLContextForUser
>({
  type: GT.NonNull(PaymentSendPayload),
  args: {
    input: { type: GT.NonNull(LnNoAmountInvoicePaymentInput) },
  },
  resolve: async (_, args, { domainAccount, logger }) => {
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

    const status = await Wallets.payNoAmountInvoiceByWalletId({
      senderWalletId: walletId,
      paymentRequest,
      memo: memo ?? null,
      amount,
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

export default LnNoAmountInvoicePaymentSendMutation
