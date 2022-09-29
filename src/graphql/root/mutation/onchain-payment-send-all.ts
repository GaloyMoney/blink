import { GT } from "@graphql/index"
import Memo from "@graphql/types/scalar/memo"
import { mapAndParseErrorForGqlResponse } from "@graphql/error-map"
import WalletId from "@graphql/types/scalar/wallet-id"
import OnChainAddress from "@graphql/types/scalar/on-chain-address"
import PaymentSendPayload from "@graphql/types/payload/payment-send"
import TargetConfirmations from "@graphql/types/scalar/target-confirmations"
import { validateIsBtcWalletForMutation } from "@graphql/helpers"
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

const OnChainPaymentSendAllMutation = GT.Field<
  {
    input: {
      walletId: WalletId | InputValidationError
      address: OnChainAddress | InputValidationError
      memo: Memo | InputValidationError | null
      targetConfirmations: TargetConfirmations | InputValidationError
    }
  },
  null,
  GraphQLContextForUser
>({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(PaymentSendPayload),
  args: {
    input: { type: GT.NonNull(OnChainPaymentSendAllInput) },
  },
  resolve: async (_, args, { domainAccount }) => {
    const { walletId, address, memo, targetConfirmations } = args.input

    if (walletId instanceof Error) {
      return { errors: [{ message: walletId.message }] }
    }

    if (address instanceof Error) {
      return { errors: [{ message: address.message }] }
    }

    if (memo instanceof Error) {
      return { errors: [{ message: memo.message }] }
    }

    if (targetConfirmations instanceof Error) {
      return { errors: [{ message: targetConfirmations.message }] }
    }

    const btcWalletValidated = await validateIsBtcWalletForMutation(walletId)
    if (btcWalletValidated != true) return btcWalletValidated

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
      return { status: "failed", errors: [mapAndParseErrorForGqlResponse(status)] }
    }

    return {
      errors: [],
      status: status.value,
    }
  },
})

export default OnChainPaymentSendAllMutation
