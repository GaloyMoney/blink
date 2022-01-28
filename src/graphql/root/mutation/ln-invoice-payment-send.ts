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
  ACCOUNT_USERNAME,
} from "@services/tracing"
import { InputValidationError } from "@graphql/error"

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

        const status = await Wallets.payLnInvoiceByWalletId({
          senderWalletId: walletId,
          paymentRequest,
          memo: memo ?? null,
          payerAccountId: domainAccount.id,
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
