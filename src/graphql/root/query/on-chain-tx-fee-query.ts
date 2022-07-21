import { GT } from "@graphql/index"
import { Wallets } from "@app"
import { mapError } from "@graphql/error-map"
import WalletId from "@graphql/types/scalar/wallet-id"
import SatAmount from "@graphql/types/scalar/sat-amount"
import OnChainTxFee from "@graphql/types/object/onchain-tx-fee"
import OnChainAddress from "@graphql/types/scalar/on-chain-address"
import TargetConfirmations from "@graphql/types/scalar/target-confirmations"
import { validateIsBtcWalletForMutation } from "@graphql/helpers"

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

    const btcWalletValidated = await validateIsBtcWalletForMutation(walletId)
    if (btcWalletValidated != true) return btcWalletValidated

    const fee = await Wallets.getOnChainFee({
      walletId,
      account: domainAccount as Account,
      amount,
      address,
      targetConfirmations,
    })
    if (fee instanceof Error) throw mapError(fee)

    return {
      amount: fee,
      targetConfirmations,
    }
  },
})

export default OnChainTxFeeQuery
