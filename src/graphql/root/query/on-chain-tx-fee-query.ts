import { GT } from "@graphql/index"
import SatAmount from "@graphql/types/scalar/sat-amount"
import OnChainTxFee from "@graphql/types/object/onchain-tx-fee"
import OnChainAddress from "@graphql/types/scalar/on-chain-address"
import TargetConfirmations from "@graphql/types/scalar/target-confirmations"
import WalletId from "@graphql/types/scalar/wallet-id"

import { ApolloError } from "apollo-server-errors"
import * as Wallets from "@app/wallets"
import * as Accounts from "@app/accounts"

const OnChainTxFeeQuery = GT.Field({
  type: GT.NonNull(OnChainTxFee),
  args: {
    walletId: { type: GT.NonNull(WalletId) },
    address: { type: GT.NonNull(OnChainAddress) },
    amount: { type: GT.NonNull(SatAmount) },
    targetConfirmations: { type: TargetConfirmations, defaultValue: 1 },
  },
  resolve: async (_, args, { domainUser }) => {
    const { walletId, address, amount, targetConfirmations } = args

    for (const input of [walletId, address, amount, targetConfirmations]) {
      if (input instanceof Error) throw input
    }

    let fee: Satoshis | Error | null = null
    if (walletId) {
      const hasPermissions = await Accounts.hasPermissions(domainUser.id, walletId)
      if (hasPermissions instanceof Error) throw new ApolloError(hasPermissions.message)

      if (!hasPermissions) throw new ApolloError("Invalid walletId")

      fee = await Wallets.getOnChainFeeByWalletPublicId({
        walletPublicId: walletId,
        amount,
        address,
        targetConfirmations,
      })
    }

    if (!fee) {
      const account = await Accounts.getAccount(domainUser.defaultAccountId)
      if (account instanceof Error) throw account

      if (!account.walletIds.length)
        throw new Error("Account does not have a default wallet")

      fee = await Wallets.getOnChainFeeByWalletId({
        walletId: account.walletIds[0],
        amount,
        address,
        targetConfirmations,
      })
    }

    if (fee instanceof Error) throw fee

    return {
      amount: fee,
      targetConfirmations,
    }
  },
})

export default OnChainTxFeeQuery
