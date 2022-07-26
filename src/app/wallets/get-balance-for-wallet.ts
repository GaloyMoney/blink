import { LedgerService } from "@services/ledger"
import { updatePendingPaymentsByWalletId } from "@app/payments"

import { updatePendingInvoicesByWalletId } from "./update-pending-invoices"

export const getBalanceForWallet = async ({
  walletId,
  logger,
}: {
  walletId: WalletId
  logger: Logger
}): Promise<CurrencyBaseAmount | ApplicationError> => {
  const [, updatePaymentsResult] = await Promise.all([
    updatePendingInvoicesByWalletId({
      walletId,
      logger,
    }),
    updatePendingPaymentsByWalletId({
      walletId,
      logger,
    }),
  ])
  if (updatePaymentsResult instanceof Error) return updatePaymentsResult

  return LedgerService().getWalletBalance(walletId)
}
