import { LedgerService } from "@services/ledger"
import { updatePendingPaymentsByWalletId } from "@app/payments"

import { updatePendingInvoicesByWalletId } from "./update-pending-invoices"

export const getBalanceForWallet = async ({
  walletId,
  lock,
  logger,
}: {
  walletId: WalletId
  lock?: DistributedLock
  logger: Logger
}): Promise<CurrencyBaseAmount | ApplicationError> => {
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

  return LedgerService().getWalletBalance(walletId)
}
