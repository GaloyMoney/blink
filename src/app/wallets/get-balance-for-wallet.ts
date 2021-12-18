import { LedgerService } from "@services/ledger"
import * as Wallets from "@app/wallets"

export const getBalanceForWallet = async ({
  walletId,
  lock,
  logger,
}: {
  walletId: WalletId
  lock?: DistributedLock
  logger: Logger
}): Promise<Satoshis | ApplicationError> => {
  const [, updatePaymentsResult] = await Promise.all([
    Wallets.updatePendingInvoices({
      walletId,
      lock,
      logger,
    }),
    Wallets.updatePendingPayments({
      walletId,
      lock,
      logger,
    }),
  ])
  if (updatePaymentsResult instanceof Error) throw updatePaymentsResult

  return getBalanceForWalletId(walletId)
}

export const getBalanceForWalletId = async (
  walletId: WalletId,
): Promise<Satoshis | ApplicationError> => {
  const balance = await LedgerService().getWalletBalance(walletId)
  if (balance instanceof Error) return balance

  return balance
}
