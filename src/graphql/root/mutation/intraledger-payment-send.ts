import { Wallets, Accounts } from "@app"
import { checkedToWalletId } from "@domain/wallets"
import { WalletCurrency } from "@domain/shared"
import { mapError } from "@graphql/error-map"
import { GT } from "@graphql/index"
import PaymentSendPayload from "@graphql/types/payload/payment-send"
import Memo from "@graphql/types/scalar/memo"
import SatAmount from "@graphql/types/scalar/sat-amount"
import WalletId from "@graphql/types/scalar/wallet-id"
import { WalletsRepository } from "@services/mongoose"
import dedent from "dedent"

const IntraLedgerPaymentSendInput = GT.Input({
  name: "IntraLedgerPaymentSendInput",
  fields: () => ({
    walletId: { type: GT.NonNull(WalletId), description: "The wallet ID of the sender." }, // TODO: rename senderWalletId
    recipientWalletId: { type: GT.NonNull(WalletId) },
    amount: { type: GT.NonNull(SatAmount), description: "Amount in satoshis." },
    memo: { type: Memo, description: "Optional memo to be attached to the payment." },
  }),
})

const IntraLedgerPaymentSendMutation = GT.Field({
  type: GT.NonNull(PaymentSendPayload),
  description: dedent`Actions a payment which is internal to the ledger e.g. it does
  not use onchain/lightning.  Does not currently support payments to or from USD wallets.
  Returns payment status (success, failed, pending, already_paid).`,
  args: {
    input: { type: GT.NonNull(IntraLedgerPaymentSendInput) },
  },
  resolve: async (_, args, { domainAccount, logger }: GraphQLContextForUser) => {
    const { walletId, recipientWalletId, amount, memo } = args.input
    for (const input of [walletId, recipientWalletId, amount, memo]) {
      if (input instanceof Error) {
        return { errors: [{ message: input.message }] }
      }
    }

    const senderWalletId = checkedToWalletId(walletId)
    if (senderWalletId instanceof Error) {
      const appErr = mapError(senderWalletId)
      return { errors: [{ message: appErr.message }] }
    }

    const recipientWalletIdChecked = checkedToWalletId(recipientWalletId)
    if (recipientWalletIdChecked instanceof Error) {
      const appErr = mapError(recipientWalletIdChecked)
      return { errors: [{ message: appErr.message }] }
    }

    const senderWallet = await WalletsRepository().findById(senderWalletId)
    if (senderWallet instanceof Error)
      return { errors: [{ message: mapError(senderWallet).message }] }

    const MutationDoesNotMatchWalletCurrencyError =
      "MutationDoesNotMatchWalletCurrencyError"
    if (senderWallet.currency === WalletCurrency.Usd) {
      return { errors: [{ message: MutationDoesNotMatchWalletCurrencyError }] }
    }

    const recipientWallet = await WalletsRepository().findById(recipientWalletId)
    if (recipientWallet instanceof Error)
      return { errors: [{ message: mapError(recipientWallet).message }] }

    if (recipientWallet.currency === WalletCurrency.Usd) {
      return { errors: [{ message: MutationDoesNotMatchWalletCurrencyError }] }
    }

    const recipientUsername = await Accounts.getUsernameFromWalletId(
      recipientWalletIdChecked,
    )
    if (recipientUsername instanceof Error) {
      const appErr = mapError(recipientUsername)
      return { errors: [{ message: appErr.message }] }
    }

    const status = await Wallets.intraledgerPaymentSendUsername({
      recipientUsername,
      memo,
      amount,
      senderWalletId: walletId,
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
})

export default IntraLedgerPaymentSendMutation
