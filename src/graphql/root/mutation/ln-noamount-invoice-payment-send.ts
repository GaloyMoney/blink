import { mapError } from "@graphql/error-map"
import { lnNoAmountInvoicePaymentSend } from "@app/wallets"
import { GT } from "@graphql/index"
import PaymentSendPayload from "@graphql/types/payload/payment-send"
import LnIPaymentRequest from "@graphql/types/scalar/ln-payment-request"
import Memo from "@graphql/types/scalar/memo"
import SatAmount from "@graphql/types/scalar/sat-amount"

const LnNoAmountInvoicePaymentInput = new GT.Input({
  name: "LnNoAmountInvoicePaymentInput",
  fields: () => ({
    paymentRequest: { type: GT.NonNull(LnIPaymentRequest) },
    amount: { type: GT.NonNull(SatAmount) },
    memo: { type: Memo },
  }),
})

const LnNoAmountInvoicePaymentSendMutation = GT.Field({
  type: GT.NonNull(PaymentSendPayload),
  args: {
    input: { type: GT.NonNull(LnNoAmountInvoicePaymentInput) },
  },
  resolve: async (_, args, { user, wallet, logger }) => {
    const { paymentRequest, amount, memo } = args.input
    for (const input of [memo, amount, paymentRequest]) {
      if (input instanceof Error) {
        return { errors: [{ message: input.message }] }
      }
    }

    const status = await lnNoAmountInvoicePaymentSend({
      paymentRequest,
      memo,
      amount,
      walletId: wallet.user.id as WalletId,
      userId: user.id as UserId,
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
