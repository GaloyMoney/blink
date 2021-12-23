import { Accounts, Wallets } from "@app"
import { checkedToWalletId } from "@domain/wallets"
import { GT } from "@graphql/index"

import PaymentSendPayload from "@graphql/types/payload/payment-send"
import Memo from "@graphql/types/scalar/memo"
import SatAmount from "@graphql/types/scalar/sat-amount"
import WalletId from "@graphql/types/scalar/wallet-id"
import { mapError } from "@graphql/error-map"

const IntraLedgerPaymentSendInput = new GT.Input({
  name: "IntraLedgerPaymentSendInput",
  fields: () => ({
    walletId: { type: GT.NonNull(WalletId) },
    recipientWalletId: { type: GT.NonNull(WalletId) },
    amount: { type: GT.NonNull(SatAmount) },
    memo: { type: Memo },
  }),
})

const IntraLedgerPaymentSendMutation = GT.Field({
  type: GT.NonNull(PaymentSendPayload),
  args: {
    input: { type: GT.NonNull(IntraLedgerPaymentSendInput) },
  },
  resolve: async (_, args, { user, logger }) => {
    const { walletId, recipientWalletId, amount, memo } = args.input
    for (const input of [walletId, recipientWalletId, amount, memo]) {
      if (input instanceof Error) {
        return { errors: [{ message: input.message }] }
      }
    }

    const wallet = await Wallets.getWallet(walletId)
    if (wallet instanceof Error) {
      const appErr = mapError(wallet)
      return { errors: [{ message: appErr.message }] }
    }

    const recipientWalletIdChecked = checkedToWalletId(recipientWalletId)
    if (recipientWalletIdChecked instanceof Error) {
      const appErr = mapError(recipientWalletIdChecked)
      return { errors: [{ message: appErr.message }] }
    }

    const recipientUsername = await Accounts.getUsernameFromWalletId(
      recipientWalletIdChecked,
    )
    if (recipientUsername instanceof Error) {
      const appErr = mapError(recipientUsername)
      return { errors: [{ message: appErr.message }] }
    }

    const status = await Wallets.intraledgerPaymentSend({
      recipientUsername,
      memo,
      amount,
      walletId,
      userId: user.id,
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
