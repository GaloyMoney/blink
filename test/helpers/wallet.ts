import { getBalanceForWallet } from "@app/wallets"
import { baseLogger } from "@services/logger"

export const getBalanceHelper = async (
  walletId: WalletId,
): Promise<CurrencyBaseAmount> => {
  const balance = await getBalanceForWallet({
    walletId,
    logger: baseLogger,
  })
  if (balance instanceof Error) throw balance
  return balance
}
