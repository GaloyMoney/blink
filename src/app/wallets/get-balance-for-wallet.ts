import { LedgerService } from "@services/ledger"
import { updatePendingInvoices } from "./update-pending-invoices"
import { updatePendingPayments } from "./update-pending-payments"

export const getBalanceForWallet = async ({
  walletId,
  lock,
  logger,
}: {
  walletId: WalletId
  lock?: DistributedLock
  logger: Logger
}): Promise<Satoshis | ApplicationError> => {
  // FIXME(nicolas, arvin): lnd take some time long to respond for updatePendingInvoice
  // so removing the await will enable a balance that will return a lot more quickly
  // the real fix for that is to implement https://github.com/GaloyMoney/galoy/issues/604
  // so that there is no longer a dependency between getBalanceForWallet and updatePendingInvoices
  // const [, updatePaymentsResult] =
  Promise.all([
    updatePendingInvoices({
      walletId,
      lock,
      logger,
    }),
    updatePendingPayments({
      walletId,
      lock,
      logger,
    }),
  ])
  // if (updatePaymentsResult instanceof Error) throw updatePaymentsResult

  return getBalanceForWalletId(walletId)
}

export const getBalanceForWalletId = async (
  walletId: WalletId,
): Promise<Satoshis | ApplicationError> => {
  const balance = await LedgerService().getWalletBalance(walletId)
  if (balance instanceof Error) return balance

  return balance
}
