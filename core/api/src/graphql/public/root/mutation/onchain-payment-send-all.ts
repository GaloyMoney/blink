import { PayoutSpeed as DomainPayoutSpeed } from "@/domain/bitcoin/onchain"

import { GT } from "@/graphql/index"
import Memo from "@/graphql/shared/types/scalar/memo"
import { mapAndParseErrorForGqlResponse } from "@/graphql/error-map"
import OnChainAddress from "@/graphql/shared/types/scalar/on-chain-address"
import PaymentSendPayload from "@/graphql/public/types/payload/payment-send"
import PayoutSpeed from "@/graphql/public/types/scalar/payout-speed"
import WalletId from "@/graphql/shared/types/scalar/wallet-id"

import { Payments } from "@/app"

const OnChainPaymentSendAllInput = GT.Input({
  name: "OnChainPaymentSendAllInput",
  fields: () => ({
    walletId: { type: GT.NonNull(WalletId) },
    address: { type: GT.NonNull(OnChainAddress) },
    speed: {
      type: GT.NonNull(PayoutSpeed),
      defaultValue: DomainPayoutSpeed.Fast,
    },
    memo: { type: Memo },
  }),
})

const OnChainPaymentSendAllMutation = GT.Field<
  null,
  GraphQLPublicContextAuth,
  {
    input: {
      walletId: WalletId | InputValidationError
      address: OnChainAddress | InputValidationError
      memo: Memo | InputValidationError | null
      speed: PayoutSpeed | InputValidationError
    }
  }
>({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(PaymentSendPayload),
  args: {
    input: { type: GT.NonNull(OnChainPaymentSendAllInput) },
  },
  resolve: async (_, args, { domainAccount }) => {
    const { walletId, address, memo, speed } = args.input

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

    const result = await Payments.payAllOnChainByWalletId({
      senderAccount: domainAccount,
      senderWalletId: walletId,
      address,
      speed,
      memo,
    })

    if (result instanceof Error) {
      return { status: "failed", errors: [mapAndParseErrorForGqlResponse(result)] }
    }

    return {
      errors: [],
      status: result.status.value,
      transaction: result.transaction,
    }
  },
})

export default OnChainPaymentSendAllMutation
