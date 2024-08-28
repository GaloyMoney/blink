import dedent from "dedent"

import PaymentSendPayload from "../../types/payload/payment-send"

import { Payments } from "@/app"

import { GT } from "@/graphql/index"
import WalletId from "@/graphql/shared/types/scalar/wallet-id"
import SatAmount from "@/graphql/shared/types/scalar/sat-amount"
import Memo from "@/graphql/shared/types/scalar/memo"
import { mapAndParseErrorForGqlResponse } from "@/graphql/error-map"

const LnAddressPaymentSendInput = GT.Input({
  name: "LnAddressPaymentSendInput",
  fields: () => ({
    walletId: {
      type: GT.NonNull(WalletId),
      description: "Wallet ID to send bitcoin from.",
    },
    amount: { type: GT.NonNull(SatAmount), description: "Amount in satoshis." },
    lnAddress: {
      type: GT.NonNull(GT.String),
      description: "Lightning address to send to.",
    },
    memo: {
      type: Memo,
      description: "Optional memo to associate with the lightning invoice.",
    },
  }),
})

const LnAddressPaymentSendMutation = GT.Field<
  null,
  GraphQLPublicContextAuth,
  {
    input: {
      walletId: WalletId | InputValidationError
      amount: Satoshis | InputValidationError
      lnAddress: string | InputValidationError
      memo?: string | InputValidationError
    }
  }
>({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(PaymentSendPayload),
  description: dedent`Sends a payment to a lightning address.`,
  args: {
    input: { type: GT.NonNull(LnAddressPaymentSendInput) },
  },
  resolve: async (_, args, { domainAccount }) => {
    const { walletId, amount, lnAddress, memo } = args.input
    if (lnAddress instanceof Error) {
      return { errors: [{ message: lnAddress.message }] }
    }

    if (amount instanceof Error) {
      return { errors: [{ message: amount.message }] }
    }

    if (walletId instanceof Error) {
      return { errors: [{ message: walletId.message }] }
    }

    if (memo instanceof Error) {
      return { errors: [{ message: memo.message }] }
    }

    const result = await Payments.lnAddressPaymentSend({
      lnAddress,
      amount,
      senderWalletId: walletId,
      senderAccount: domainAccount,
      memo: memo ?? null,
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

export default LnAddressPaymentSendMutation
