import { Wallets } from "@app"

import { GT } from "@graphql/index"
import { mapError } from "@graphql/error-map"

import WalletId from "@graphql/types/scalar/wallet-id"
import SatAmount from "@graphql/types/scalar/sat-amount"
import OnChainAddress from "@graphql/types/scalar/on-chain-address"
import TargetConfirmations from "@graphql/types/scalar/target-confirmations"

import OnChainTxFee from "@graphql/types/object/onchain-tx-fee"

import { normalizePaymentAmount } from "../mutation"

const OnChainTxFeeQuery = GT.Field({
  type: GT.NonNull(OnChainTxFee),
  args: {
    walletId: { type: GT.NonNull(WalletId) },
    address: { type: GT.NonNull(OnChainAddress) },
    amount: { type: GT.NonNull(SatAmount) },
    targetConfirmations: { type: TargetConfirmations, defaultValue: 1 },
  },
  resolve: async (_, args, { domainAccount }) => {
    const { walletId, address, amount, targetConfirmations } = args

    for (const input of [walletId, address, amount, targetConfirmations]) {
      if (input instanceof Error) throw input
    }

    const fee = await Wallets.getOnChainFeeForBtcWallet({
      walletId,
      account: domainAccount as Account,
      amount,
      address,
      targetConfirmations,
    })
    if (fee instanceof Error) throw mapError(fee)

    return {
      amount: normalizePaymentAmount(fee).amount,
      targetConfirmations,
    }
  },
})

export default OnChainTxFeeQuery
