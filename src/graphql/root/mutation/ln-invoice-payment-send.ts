import { Wallets } from "@app"
import { InputValidationError } from "@graphql/error"
import { mapError } from "@graphql/error-map"
import { GT } from "@graphql/index"
import PaymentSendPayload from "@graphql/types/payload/payment-send"
import LnPaymentRequest from "@graphql/types/scalar/ln-payment-request"
import Memo from "@graphql/types/scalar/memo"
import WalletId from "@graphql/types/scalar/wallet-id"
import {
  ACCOUNT_USERNAME,
  addAttributesToCurrentSpanAndPropagate,
  SemanticAttributes,
} from "@services/tracing"

const LnInvoicePaymentInput = GT.Input({
  name: "LnInvoicePaymentInput",
  fields: () => ({
    walletId: { type: GT.NonNull(WalletId) },
    paymentRequest: { type: GT.NonNull(LnPaymentRequest) },
    memo: { type: Memo },
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
  args: {
    input: { type: GT.NonNull(LnInvoicePaymentInput) },
  },
  resolve: async (_, args, { ip, domainAccount, domainUser, logger }) =>
    addAttributesToCurrentSpanAndPropagate(
      {
        [SemanticAttributes.ENDUSER_ID]: domainUser?.id,
        [ACCOUNT_USERNAME]: domainAccount?.username,
        [SemanticAttributes.HTTP_CLIENT_IP]: ip,
      },
      async () => {
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

        const status = await Wallets.payInvoiceByWalletId({
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
    ),
})

export default LnInvoicePaymentSendMutation
