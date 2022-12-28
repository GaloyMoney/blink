import { Wallets } from "@app"

import { GT } from "@graphql/index"
import { mapError } from "@graphql/error-map"
import { validateIsUsdWalletForQuery } from "@graphql/helpers"

import WalletId from "@graphql/types/scalar/wallet-id"
import CentAmount from "@graphql/types/scalar/cent-amount"
import OnChainAddress from "@graphql/types/scalar/on-chain-address"
import TargetConfirmations from "@graphql/types/scalar/target-confirmations"

import OnChainUsdTxFee from "@graphql/types/object/onchain-usd-tx-fee"

import { normalizePaymentAmount } from "../mutation"

const OnChainUsdTxFeeQuery = GT.Field({
  type: GT.NonNull(OnChainUsdTxFee),
  args: {
    walletId: { type: GT.NonNull(WalletId) },
    address: { type: GT.NonNull(OnChainAddress) },
    amount: { type: GT.NonNull(CentAmount) },
    targetConfirmations: { type: TargetConfirmations, defaultValue: 1 },
  },
  resolve: async (_, args, { domainAccount }) => {
    const { walletId, address, amount, targetConfirmations } = args

    for (const input of [walletId, address, amount, targetConfirmations]) {
      if (input instanceof Error) throw input
    }

    const usdWalletValidated = await validateIsUsdWalletForQuery(walletId)
    if (usdWalletValidated instanceof Error) throw usdWalletValidated

    const fee = await Wallets.getOnChainFee({
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

export default OnChainUsdTxFeeQuery
