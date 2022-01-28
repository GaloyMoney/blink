import { GT } from "@graphql/index"
import Memo from "@graphql/types/scalar/memo"
import { mapError } from "@graphql/error-map"
import WalletId from "@graphql/types/scalar/wallet-id"
import OnChainAddress from "@graphql/types/scalar/on-chain-address"
import PaymentSendPayload from "@graphql/types/payload/payment-send"
import TargetConfirmations from "@graphql/types/scalar/target-confirmations"
import { Wallets } from "@app"

const OnChainPaymentSendAllInput = GT.Input({
  name: "OnChainPaymentSendAllInput",
  fields: () => ({
    walletId: { type: GT.NonNull(WalletId) },
    address: { type: GT.NonNull(OnChainAddress) },
    memo: { type: Memo },
    targetConfirmations: { type: TargetConfirmations, defaultValue: 1 },
  }),
})

const OnChainPaymentSendAllMutation = GT.Field<{ input }, null, GraphQLContextForUser>({
  type: GT.NonNull(PaymentSendPayload),
  args: {
    input: { type: GT.NonNull(OnChainPaymentSendAllInput) },
  },
  resolve: async (_, args, { domainAccount }) => {
    const { walletId, address, memo, targetConfirmations } = args.input

    for (const input of [walletId, memo, address, targetConfirmations]) {
      if (input instanceof Error) {
        return { errors: [{ message: input.message }] }
      }
    }

    const status = await Wallets.payOnChainByWalletId({
      senderAccount: domainAccount,
      senderWalletId: walletId,
      amount: 0,
      address,
      targetConfirmations,
      memo,
      sendAll: true,
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

export default OnChainPaymentSendAllMutation
