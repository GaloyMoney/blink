import { Wallets } from "@app"

import { PayoutSpeed as DomainPayoutSpeed } from "@domain/bitcoin/onchain"

import { GT } from "@graphql/index"
import { mapError } from "@graphql/error-map"

import OnChainAddress from "@graphql/shared/types/scalar/on-chain-address"
import PayoutSpeed from "@graphql/public/types/scalar/payout-speed"
import SatAmount from "@graphql/shared/types/scalar/sat-amount"
import TargetConfirmations from "@graphql/public/types/scalar/target-confirmations"
import WalletId from "@graphql/shared/types/scalar/wallet-id"

import OnChainTxFee from "@graphql/public/types/object/onchain-tx-fee"

import { normalizePaymentAmount } from "../../../shared/root/mutation"

const OnChainTxFeeQuery = GT.Field<null, GraphQLPublicContextAuth>({
  type: GT.NonNull(OnChainTxFee),
  args: {
    walletId: { type: GT.NonNull(WalletId) },
    address: { type: GT.NonNull(OnChainAddress) },
    amount: { type: GT.NonNull(SatAmount) },
    speed: {
      type: PayoutSpeed,
      defaultValue: DomainPayoutSpeed.Fast,
    },
    targetConfirmations: {
      deprecationReason: "Ignored - will be replaced",
      type: TargetConfirmations,
      defaultValue: 0,
    },
  },
  resolve: async (_, args, { domainAccount }) => {
    const { walletId, address, amount, speed } = args

    for (const input of [walletId, address, amount, speed]) {
      if (input instanceof Error) throw input
    }

    const fee = await Wallets.getOnChainFeeForBtcWallet({
      walletId,
      account: domainAccount as Account,
      amount,
      address,
      speed,
    })
    if (fee instanceof Error) throw mapError(fee)

    return {
      amount: normalizePaymentAmount(fee).amount,
      targetConfirmations: 0,
    }
  },
})

export default OnChainTxFeeQuery
