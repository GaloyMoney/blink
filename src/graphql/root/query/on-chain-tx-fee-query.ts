import { GT } from "@graphql/index"
import * as Wallets from "@app/wallets"
import * as Accounts from "@app/accounts"
import { ApolloError } from "apollo-server-errors"
import SatAmount from "@graphql/types/scalar/sat-amount"
import WalletName from "@graphql/types/scalar/wallet-name"
import OnChainTxFee from "@graphql/types/object/onchain-tx-fee"
import OnChainAddress from "@graphql/types/scalar/on-chain-address"
import TargetConfirmations from "@graphql/types/scalar/target-confirmations"

const OnChainTxFeeQuery = GT.Field({
  type: GT.NonNull(OnChainTxFee),
  args: {
    walletName: { type: WalletName },
    address: { type: GT.NonNull(OnChainAddress) },
    amount: { type: GT.NonNull(SatAmount) },
    targetConfirmations: { type: TargetConfirmations, defaultValue: 3 },
  },
  resolve: async (_, args, { domainUser }) => {
    const { walletName, address, amount, targetConfirmations } = args

    for (const input of [walletName, address, amount, targetConfirmations]) {
      if (input instanceof Error) throw input
    }

    let fee: Satoshis | Error | null = null
    if (walletName) {
      const hasPermissions = await Accounts.hasPermissions(domainUser.id, walletName)
      if (hasPermissions instanceof Error) throw new ApolloError(hasPermissions.message)

      if (!hasPermissions) throw new ApolloError("Invalid walletName")

      fee = await Wallets.getOnChainFeeByWalletName({
        walletName,
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
