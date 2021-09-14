import { checkedToWalletName } from "@domain/wallets"
import { GT } from "@graphql/index"

import PaymentSendPayload from "@graphql/types/payload/payment-send"
import Memo from "@graphql/types/scalar/memo"
import SatAmount from "@graphql/types/scalar/sat-amount"
import WalletName from "@graphql/types/scalar/wallet-name"

const IntraLedgerPaymentSendInput = new GT.Input({
  name: "IntraLedgerPaymentSendInput",
  fields: () => ({
    recipient: { type: GT.NonNull(WalletName) },
    amount: { type: GT.NonNull(SatAmount) },
    memo: { type: Memo },
  }),
})

const IntraLedgerPaymentSendMutation = GT.Field({
  type: GT.NonNull(PaymentSendPayload),
  args: {
    input: { type: GT.NonNull(IntraLedgerPaymentSendInput) },
  },
  resolve: async (_, args, { wallet }) => {
    const { recipient, amount, memo } = args.input
    for (const input of [recipient, amount, memo]) {
      if (input instanceof Error) {
        return { errors: [{ message: input.message }] }
      }
    }

    const walletName = checkedToWalletName(recipient)
    if (walletName instanceof Error) {
      return { errors: [{ message: walletName.message }] }
    }

    try {
      const status = await wallet.pay({ username: walletName, amount, memo })
      if (status instanceof Error) {
        return { status: "failed", errors: [{ message: status.message }] }
      }
      return {
        errors: [],
        status,
      }
    } catch (err) {
      return {
        status: "failed",
        errors: [{ message: err.message }],
      }
    }
  },
})

export default IntraLedgerPaymentSendMutation
