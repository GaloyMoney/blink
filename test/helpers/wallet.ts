import * as Wallets from "@app/wallets"
import { baseLogger } from "@services/logger"

export const getBTCBalance = async (walletId: WalletId): Promise<Satoshis> => {
  const balanceSats = await Wallets.getBalanceForWallet({
    walletId,
    logger: baseLogger,
  })
  if (balanceSats instanceof Error) throw balanceSats
  return balanceSats
}
