import dedent from "dedent"

import { Payments } from "@/app"
import { WalletCurrency } from "@/domain/shared"
import { mapAndParseErrorForGqlResponse } from "@/graphql/error-map"
import { GT } from "@/graphql/index"
import PaymentSendPayload from "@/graphql/public/types/payload/payment-send"
import Memo from "@/graphql/shared/types/scalar/memo"
import SatAmount from "@/graphql/shared/types/scalar/sat-amount"
import WalletId from "@/graphql/shared/types/scalar/wallet-id"
import WalletIdOrPhone from "@/graphql/shared/types/scalar/wallet-id-or-phone"

const IntraLedgerPaymentSendInput = GT.Input({
  name: "IntraLedgerPaymentSendInput",
  fields: () => ({
    walletId: { type: GT.NonNull(WalletId), description: "The wallet ID of the sender." }, // TODO: rename senderWalletId
    recipientWalletId: {
      type: GT.NonNull(WalletIdOrPhone),
      description: "The recipient wallet ID or phone number.",
    },
    amount: { type: GT.NonNull(SatAmount), description: "Amount in satoshis." },
    memo: { type: Memo, description: "Optional memo to be attached to the payment." },
  }),
})

const IntraLedgerPaymentSendMutation = GT.Field<null, GraphQLPublicContextAuth>({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(PaymentSendPayload),
  description: dedent`Actions a payment which is internal to the ledger e.g. it does
  not use onchain/lightning. Returns payment status (success,
  failed, pending, already_paid).`,
  args: {
    input: { type: GT.NonNull(IntraLedgerPaymentSendInput) },
  },
  resolve: async (_, args, { domainAccount }) => {
    const { walletId, recipientWalletId, amount, memo } = args.input
    for (const input of [walletId, recipientWalletId, amount, memo]) {
      if (input instanceof Error) {
        return { errors: [{ message: input.message }] }
      }
    }

    const result = await Payments.intraledgerPaymentSendToWalletOrPhone({
      recipientIdentifier: recipientWalletId,
      recipientWalletCurrency: WalletCurrency.Btc,
      memo,
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

export default IntraLedgerPaymentSendMutation
