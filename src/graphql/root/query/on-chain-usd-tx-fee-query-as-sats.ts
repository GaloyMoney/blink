import { Wallets } from "@app"

import { GT } from "@graphql/index"
import { mapError } from "@graphql/error-map"

import WalletId from "@graphql/types/scalar/wallet-id"
import SatAmount from "@graphql/types/scalar/sat-amount"
import OnChainAddress from "@graphql/types/scalar/on-chain-address"
import TargetConfirmations from "@graphql/types/scalar/target-confirmations"

import OnChainUsdTxFee from "@graphql/types/object/onchain-usd-tx-fee"

import { PayoutSpeed } from "@domain/bitcoin/onchain"

import { normalizePaymentAmount } from "../mutation"

const OnChainUsdTxFeeAsBtcDenominatedQuery = GT.Field({
  type: GT.NonNull(OnChainUsdTxFee),
  args: {
    walletId: { type: GT.NonNull(WalletId) },
    address: { type: GT.NonNull(OnChainAddress) },
    amount: { type: GT.NonNull(SatAmount) },
    targetConfirmations: {      deprecationReason: "Ignored - will be replaced",
      type: TargetConfirmations, defaultValue: 1 },
  },
  resolve: async (_, args, { domainAccount }) => {
    const { walletId, address, amount, targetConfirmations } = args

    for (const input of [walletId, address, amount, targetConfirmations]) {
      if (input instanceof Error) throw input
    }

    const fee = await Wallets.getOnChainFeeForUsdWalletAndBtcAmount({
      walletId,
      account: domainAccount as Account,
      amount,
      address,
      speed: PayoutSpeed.Fast,
    })
    if (fee instanceof Error) throw mapError(fee)

    return {
      amount: normalizePaymentAmount(fee).amount,
      targetConfirmations,
    }
  },
})

export default OnChainUsdTxFeeAsBtcDenominatedQuery
