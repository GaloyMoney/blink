import { PayoutSpeed as DomainPayoutSpeed } from "@domain/bitcoin/onchain"

import { Wallets } from "@app"

import { GT } from "@graphql/index"
import { mapError } from "@graphql/error-map"

import CentAmount from "@graphql/types/scalar/cent-amount"
import OnChainAddress from "@graphql/types/scalar/on-chain-address"
import PayoutSpeed from "@graphql/types/scalar/payout-speed"
import TargetConfirmations from "@graphql/types/scalar/target-confirmations"
import WalletId from "@graphql/types/scalar/wallet-id"

import OnChainUsdTxFee from "@graphql/types/object/onchain-usd-tx-fee"

import { normalizePaymentAmount } from "../mutation"

const OnChainUsdTxFeeQuery = GT.Field({
  type: GT.NonNull(OnChainUsdTxFee),
  args: {
    walletId: { type: GT.NonNull(WalletId) },
    address: { type: GT.NonNull(OnChainAddress) },
    amount: { type: GT.NonNull(CentAmount) },
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

    const fee = await Wallets.getOnChainFeeForUsdWallet({
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

export default OnChainUsdTxFeeQuery
