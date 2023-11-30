import dedent from "dedent"

import { Payments } from "@/app"
import { checkedToWalletId } from "@/domain/wallets"
import { mapAndParseErrorForGqlResponse } from "@/graphql/error-map"
import { GT } from "@/graphql/index"
import PaymentSendPayload from "@/graphql/public/types/payload/payment-send"
import CentAmount from "@/graphql/public/types/scalar/cent-amount"
import Memo from "@/graphql/shared/types/scalar/memo"
import WalletId from "@/graphql/shared/types/scalar/wallet-id"

const IntraLedgerUsdPaymentSendInput = GT.Input({
  name: "IntraLedgerUsdPaymentSendInput",
  fields: () => ({
    walletId: { type: GT.NonNull(WalletId), description: "The wallet ID of the sender." }, // TODO: rename senderWalletId
    recipientWalletId: { type: GT.NonNull(WalletId) },
    amount: { type: GT.NonNull(CentAmount), description: "Amount in cents." },
    memo: { type: Memo, description: "Optional memo to be attached to the payment." },
  }),
})

const IntraLedgerUsdPaymentSendMutation = GT.Field<null, GraphQLPublicContextAuth>({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(PaymentSendPayload),
  description: dedent`Actions a payment which is internal to the ledger e.g. it does
  not use onchain/lightning. Returns payment status (success,
  failed, pending, already_paid).`,
  args: {
    input: { type: GT.NonNull(IntraLedgerUsdPaymentSendInput) },
  },
  resolve: async (_, args, { domainAccount }: GraphQLPublicContextAuth) => {
    const { walletId, recipientWalletId, amount, memo } = args.input
    for (const input of [walletId, recipientWalletId, amount, memo]) {
      if (input instanceof Error) {
        return { errors: [{ message: input.message }] }
      }
    }

    const senderWalletId = checkedToWalletId(walletId)
    if (senderWalletId instanceof Error) {
      return { errors: [mapAndParseErrorForGqlResponse(senderWalletId)] }
    }

    const recipientWalletIdChecked = checkedToWalletId(recipientWalletId)
    if (recipientWalletIdChecked instanceof Error) {
      return { errors: [mapAndParseErrorForGqlResponse(recipientWalletIdChecked)] }
    }

    const result = await Payments.intraledgerPaymentSendWalletIdForUsdWallet({
      recipientWalletId,
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

export default IntraLedgerUsdPaymentSendMutation
