import { GT } from "@graphql/index"
import Memo from "@graphql/types/scalar/memo"
import { mapError } from "@graphql/error-map"
import WalletId from "@graphql/types/scalar/wallet-id"
import SatAmount from "@graphql/types/scalar/sat-amount"
import OnChainAddress from "@graphql/types/scalar/on-chain-address"
import PaymentSendPayload from "@graphql/types/payload/payment-send"
import TargetConfirmations from "@graphql/types/scalar/target-confirmations"
import { Wallets } from "@app"

const OnChainPaymentSendInput = new GT.Input({
  name: "OnChainPaymentSendInput",
  fields: () => ({
    walletId: { type: GT.NonNull(WalletId) },
    address: { type: GT.NonNull(OnChainAddress) },
    amount: { type: GT.NonNull(SatAmount) },
    memo: { type: Memo },
    targetConfirmations: { type: TargetConfirmations, defaultValue: 1 },
  }),
})

const OnChainPaymentSendMutation = GT.Field({
  type: GT.NonNull(PaymentSendPayload),
  args: {
    input: { type: GT.NonNull(OnChainPaymentSendInput) },
  },
  resolve: async (_, args) => {
    const { walletId, address, amount, memo, targetConfirmations } = args.input

    for (const input of [walletId, amount, address, targetConfirmations, memo]) {
      if (input instanceof Error) {
        return { errors: [{ message: input.message }] }
      }
    }

    const status = await Wallets.payOnChainByWalletId({
      senderWalletId: walletId,
      amount,
      address,
      targetConfirmations,
      memo,
      sendAll: false,
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

export default OnChainPaymentSendMutation
