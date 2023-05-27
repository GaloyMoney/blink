import { GT } from "@graphql/index"
import Memo from "@graphql/types/scalar/memo"
import { mapAndParseErrorForGqlResponse } from "@graphql/error-map"
import CentAmount from "@graphql/types/scalar/cent-amount"
import OnChainAddress from "@graphql/types/scalar/on-chain-address"
import PaymentSendPayload from "@graphql/types/payload/payment-send"
import PayoutRequestId from "@graphql/types/scalar/payout-request-id"
import PayoutSpeed from "@graphql/types/scalar/payout-speed"
import TargetConfirmations from "@graphql/types/scalar/target-confirmations"
import WalletId from "@graphql/types/scalar/wallet-id"

import { Wallets } from "@app"

const OnChainUsdPaymentSendInput = GT.Input({
  name: "OnChainUsdPaymentSendInput",
  fields: () => ({
    walletId: { type: GT.NonNull(WalletId) },
    address: { type: GT.NonNull(OnChainAddress) },
    amount: { type: GT.NonNull(CentAmount) },
    requestId: { type: GT.NonNull(PayoutRequestId) },
    speed: { type: GT.NonNull(PayoutSpeed) },
    memo: { type: Memo },
    targetConfirmations: {
      deprecationReason: "Ignored - will be replaced",
      type: TargetConfirmations,
      defaultValue: 0,
    },
  }),
})

const OnChainUsdPaymentSendMutation = GT.Field<
  {
    input: {
      walletId: WalletId | InputValidationError
      address: OnChainAddress | InputValidationError
      amount: number
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
    input: { type: GT.NonNull(OnChainUsdPaymentSendInput) },
  },
  resolve: async (_, args, { domainAccount }) => {
    const { walletId, address, amount, memo, speed, requestId } = args.input

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

    const status = await Wallets.payOnChainByWalletIdForUsdWallet({
      senderAccount: domainAccount,
      senderWalletId: walletId,
      amount,
      address,
      speed,
      requestId,
      memo,
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

export default OnChainUsdPaymentSendMutation
