import { LedgerService } from "@services/ledger"
// import { baseLogger } from "@services/logger"
// import { updatePendingPaymentsByWalletId } from "@app/payments"

// import { updatePendingInvoicesByWalletId } from "./update-pending-invoices"

export const getBalanceForWallet = async ({
  walletId,
}: {
  walletId: WalletId
}): Promise<CurrencyBaseAmount | ApplicationError> => {
  // TODO: enable when lnd performance issues are solved
  // const [, updatePaymentsResult] = await Promise.all([
  //   updatePendingInvoicesByWalletId({
  //     walletId,
  //     logger: baseLogger,
  //   }),
  //   updatePendingPaymentsByWalletId({
  //     walletId,
  //     logger: baseLogger,
  //   }),
  // ])
  // if (updatePaymentsResult instanceof Error) return updatePaymentsResult

  return LedgerService().getWalletBalance(walletId)
}
