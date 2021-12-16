import { toLiabilitiesAccountId } from "@domain/ledger"
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
      walletId: walletId,
      lock,
      logger,
    }),
    Wallets.updatePendingPayments({
      walletId: walletId,
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
  const liabilitiesAccountId = toLiabilitiesAccountId(walletId)

  const balance = await LedgerService().getAccountBalance(liabilitiesAccountId)
  if (balance instanceof Error) return balance

  return balance
}
