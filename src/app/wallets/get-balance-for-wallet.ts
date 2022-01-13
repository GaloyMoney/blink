import { LedgerService } from "@services/ledger"

import { updatePendingInvoicesByWalletId } from "./update-pending-invoices"
import { updatePendingPaymentsByWalletId } from "./update-pending-payments"

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
    updatePendingInvoicesByWalletId({
      walletId,
      lock,
      logger,
    }),
    updatePendingPaymentsByWalletId({
      walletId,
      lock,
      logger,
    }),
  ])
  if (updatePaymentsResult instanceof Error) return updatePaymentsResult

  return getBalanceForWalletId(walletId)
}

export const getBalanceForWalletId = async (
  walletId: WalletId,
): Promise<Satoshis | ApplicationError> => {
  const balance = await LedgerService().getWalletBalance(walletId)
  if (balance instanceof Error) return balance

  return balance
}
