import { GT } from "@graphql/index"
import Memo from "@graphql/types/scalar/memo"
import { mapAndParseErrorForGqlResponse } from "@graphql/error-map"
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

const OnChainPaymentSendAllMutation = GT.Field<
  {
    input: {
      walletId: WalletId | InputValidationError
      address: OnChainAddress | InputValidationError
      memo: Memo | InputValidationError | null
      speed: PayoutSpeed | InputValidationError
      requestId: PayoutRequestId | InputValidationError
    }
  },
  null,
  GraphQLContextAuth
>({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(PaymentSendPayload),
  args: {
    input: { type: GT.NonNull(OnChainPaymentSendAllInput) },
  },
  resolve: async (_, args, { domainAccount }) => {
    const { walletId, address, memo, speed, requestId } = args.input

    if (walletId instanceof Error) {
      return { errors: [{ message: walletId.message }] }
    }

    if (address instanceof Error) {
      return { errors: [{ message: address.message }] }
    }

    if (memo instanceof Error) {
      return { errors: [{ message: memo.message }] }
    }

    if (speed instanceof Error) {
      return { errors: [{ message: speed.message }] }
    }

    if (requestId instanceof Error) {
      return { errors: [{ message: requestId.message }] }
    }

    const status = await Wallets.payAllOnChainByWalletId({
      senderAccount: domainAccount,
      senderWalletId: walletId,
      amount: 0,
      address,
      speed,
      requestId,
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
