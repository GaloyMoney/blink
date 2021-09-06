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
  Wallets.updatePendingInvoices({
    walletId: walletId,
    lock,
    logger,
  })
  const result = await Wallets.updatePendingPayments({
    walletId: walletId,
    lock,
    logger,
  })
  if (result instanceof Error) throw result

  const liabilitiesAccountId = toLiabilitiesAccountId(walletId)
  const balance = await LedgerService().getAccountBalance(liabilitiesAccountId)
  if (balance instanceof Error) return balance

  return balance
}
