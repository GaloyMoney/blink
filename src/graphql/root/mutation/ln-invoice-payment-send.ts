import { GT } from "@graphql/index"
import Memo from "@graphql/types/scalar/memo"
import { mapError } from "@graphql/error-map"
import WalletId from "@graphql/types/scalar/wallet-id"
import { Wallets } from "@app"
import PaymentSendPayload from "@graphql/types/payload/payment-send"
import LnPaymentRequest from "@graphql/types/scalar/ln-payment-request"
import {
  addAttributesToCurrentSpanAndPropagate,
  SemanticAttributes,
  ENDUSER_ALIAS,
} from "@services/tracing"

const LnInvoicePaymentInput = new GT.Input({
  name: "LnInvoicePaymentInput",
  fields: () => ({
    walletId: { type: GT.NonNull(WalletId) },
    paymentRequest: { type: GT.NonNull(LnPaymentRequest) },
    memo: { type: Memo },
  }),
})

const LnInvoicePaymentSendMutation = GT.Field({
  type: GT.NonNull(PaymentSendPayload),
  args: {
    input: { type: GT.NonNull(LnInvoicePaymentInput) },
  },
  resolve: async (_, args, { ip, domainUser, logger }) =>
    addAttributesToCurrentSpanAndPropagate(
      {
        [SemanticAttributes.ENDUSER_ID]: domainUser?.id,
        [ENDUSER_ALIAS]: domainUser?.username,
        [SemanticAttributes.HTTP_CLIENT_IP]: ip,
      },
      async () => {
        const { walletId, paymentRequest, memo } = args.input

        for (const input of [walletId, memo, paymentRequest]) {
          if (input instanceof Error) {
            return { errors: [{ message: input.message }] }
          }
        }

        const status = await Wallets.payLnInvoiceByWalletId({
          walletId,
          paymentRequest,
          memo,
          userId: domainUser.id,
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
    ),
})

export default LnInvoicePaymentSendMutation
