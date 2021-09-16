import { lnInvoicePaymentSend } from "@app/lightning"
import { GT } from "@graphql/index"
import PaymentSendPayload from "@graphql/types/payload/payment-send"
import LnPaymentRequest from "@graphql/types/scalar/ln-payment-request"
import Memo from "@graphql/types/scalar/memo"

const LnInvoicePaymentInput = new GT.Input({
  name: "LnInvoicePaymentInput",
  fields: () => ({
    paymentRequest: { type: GT.NonNull(LnPaymentRequest) },
    memo: { type: Memo },
  }),
})

const LnInvoicePaymentSendMutation = GT.Field({
  type: GT.NonNull(PaymentSendPayload),
  args: {
    input: { type: GT.NonNull(LnInvoicePaymentInput) },
  },
  resolve: async (_, args, { user, wallet, logger }) => {
    const { paymentRequest, memo } = args.input

    for (const input of [memo, paymentRequest]) {
      if (input instanceof Error) {
        return { errors: [{ message: input.message }] }
      }
    }

    try {
      const status = await lnInvoicePaymentSend({
        paymentRequest,
        memo,
        walletId: wallet.user.id as WalletId,
        userId: user.id as UserId,
        logger,
      })
      if (status instanceof Error) {
        return { status: "failed", errors: [{ message: status.message }] }
      }
      return {
        errors: [],
        status: status.value,
      }
    } catch (err) {
      return {
        status: "failed",
        errors: [{ message: err.message }],
      }
    }
  },
})

export default LnInvoicePaymentSendMutation
