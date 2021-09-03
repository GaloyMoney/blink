import * as Wallets from "@app/wallets"
import { baseLogger } from "@services/logger"

export const getBTCBalance = async (walletId: WalletId): Promise<Satoshis> => {
  const balances = await Wallets.getBalanceForWallet({
    walletId,
    logger: baseLogger,
  })
  if (balances instanceof Error) throw balances
  return balances.BTC
}
