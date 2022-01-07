import { GT } from "@graphql/index"
import Memo from "@graphql/types/scalar/memo"
import WalletId from "@graphql/types/scalar/wallet-id"
import SatAmount from "@graphql/types/scalar/sat-amount"
import OnChainAddress from "@graphql/types/scalar/on-chain-address"
import PaymentSendPayload from "@graphql/types/payload/payment-send"
import TargetConfirmations from "@graphql/types/scalar/target-confirmations"
import { LightningUserWallet } from "@core/lightning/wallet"

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
  resolve: async (_, args, { wallet }: { wallet: LightningUserWallet }) => {
    const { walletId, address, amount, memo, targetConfirmations } = args.input

    for (const input of [walletId, memo, amount, address, targetConfirmations]) {
      if (input instanceof Error) {
        return { errors: [{ message: input.message }] }
      }
    }

    try {
      const status = await wallet.onChainPay({
        address,
        amount,
        memo,
        targetConfirmations,
      })

      return {
        errors: [],
        status: status ? "success" : "failed", // TODO: Figure out pending here
      }
    } catch (err) {
      return {
        status: "failed",
        errors: [{ message: err.message }],
      }
    }
  },
})

export default OnChainPaymentSendMutation
