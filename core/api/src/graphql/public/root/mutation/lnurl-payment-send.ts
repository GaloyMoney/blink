import dedent from "dedent"

import PaymentSendPayload from "../../types/payload/payment-send"

import { Payments } from "@/app"

import { GT } from "@/graphql/index"
import WalletId from "@/graphql/shared/types/scalar/wallet-id"
import SatAmount from "@/graphql/shared/types/scalar/sat-amount"
import { mapAndParseErrorForGqlResponse } from "@/graphql/error-map"

const LnurlPaymentSendInput = GT.Input({
  name: "LnurlPaymentSendInput",
  fields: () => ({
    walletId: {
      type: GT.NonNull(WalletId),
      description: "Wallet ID to send bitcoin from.",
    },
    amount: { type: GT.NonNull(SatAmount), description: "Amount in satoshis." },
    lnurl: {
      type: GT.NonNull(GT.String),
      description: "Lnurl string to send to.",
    },
  }),
})

const LnurlPaymentSendMutation = GT.Field<
  null,
  GraphQLPublicContextAuth,
  {
    input: {
      walletId: WalletId | InputValidationError
      amount: Satoshis | InputValidationError
      lnurl: string | InputValidationError
    }
  }
>({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(PaymentSendPayload),
  description: dedent`Sends a payment to a lightning address.`,
  args: {
    input: { type: GT.NonNull(LnurlPaymentSendInput) },
  },
  resolve: async (_, args, { domainAccount }) => {
    const { walletId, amount, lnurl } = args.input
    if (lnurl instanceof Error) {
      return { errors: [{ message: lnurl.message }] }
    }

    if (amount instanceof Error) {
      return { errors: [{ message: amount.message }] }
    }

    if (walletId instanceof Error) {
      return { errors: [{ message: walletId.message }] }
    }

    const result = await Payments.lnurlPaymentSend({
      lnurl,
      amount,
      senderWalletId: walletId,
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

export default LnurlPaymentSendMutation
