import { Accounts, Payments } from "@app"
import { checkedToWalletId } from "@domain/wallets"
import { mapAndParseErrorForGqlResponse } from "@graphql/error-map"
import { validateIsUsdWalletForMutation } from "@graphql/helpers"
import { GT } from "@graphql/index"
import PaymentSendPayload from "@graphql/types/payload/payment-send"
import CentAmount from "@graphql/types/scalar/cent-amount"
import Memo from "@graphql/types/scalar/memo"
import WalletId from "@graphql/types/scalar/wallet-id"
import dedent from "dedent"

const IntraLedgerUsdPaymentSendInput = GT.Input({
  name: "IntraLedgerUsdPaymentSendInput",
  fields: () => ({
    walletId: { type: GT.NonNull(WalletId), description: "The wallet ID of the sender." }, // TODO: rename senderWalletId
    recipientWalletId: { type: GT.NonNull(WalletId) },
    amount: { type: GT.NonNull(CentAmount), description: "Amount in cents." },
    memo: { type: Memo, description: "Optional memo to be attached to the payment." },
  }),
})

const IntraLedgerUsdPaymentSendMutation = GT.Field({
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
  resolve: async (_, args, { domainAccount }: GraphQLContextForUser) => {
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

    const usdWalletValidated = await validateIsUsdWalletForMutation(walletId)
    if (usdWalletValidated != true) return usdWalletValidated

    const recipientWalletIdChecked = checkedToWalletId(recipientWalletId)
    if (recipientWalletIdChecked instanceof Error) {
      return { errors: [mapAndParseErrorForGqlResponse(recipientWalletIdChecked)] }
    }

    // TODO: confirm whether we need to check for username here
    const recipientUsername = await Accounts.getUsernameFromWalletId(
      recipientWalletIdChecked,
    )
    if (recipientUsername instanceof Error) {
      return { errors: [mapAndParseErrorForGqlResponse(recipientUsername)] }
    }

    const status = await Payments.intraledgerPaymentSendWalletId({
      recipientWalletId,
      memo,
      amount,
      senderWalletId: walletId,
      senderAccount: domainAccount,
    })
    if (status instanceof Error) {
      return { status: "failed", errors: [mapAndParseErrorForGqlResponse(status)] }
    }

    return {
      errors: [],
      status: status.value,
    }
  },
})

export default IntraLedgerUsdPaymentSendMutation
