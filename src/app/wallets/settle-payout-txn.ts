import { InvalidLedgerTransactionStateError } from "@domain/errors"
import { WalletCurrency, paymentAmountFromNumber } from "@domain/shared"
import { displayAmountFromNumber } from "@domain/fiat"

import { LedgerService, getNonEndUserWalletIds } from "@services/ledger"
import {
  AccountsRepository,
  UsersRepository,
  WalletsRepository,
} from "@services/mongoose"
import { NotificationsService } from "@services/notifications"

export const settlePayout = async (
  payoutId: PayoutId,
): Promise<true | ApplicationError> => {
  const ledger = LedgerService()

  // Settle transaction
  const settled = await ledger.settlePendingOnChainPayment(payoutId)
  if (settled instanceof Error) return settled

  // Get transaction info for notification
  const ledgerTxns = await ledger.getTransactionsByHash(
    payoutId as unknown as OnChainTxHash,
  )
  if (ledgerTxns instanceof Error) return ledgerTxns
  const nonUserWalletIds = Object.values(await getNonEndUserWalletIds())
  const userLedgerTxns = ledgerTxns.filter(
    (txn) => txn.walletId && !nonUserWalletIds.includes(txn.walletId),
  )
  const ledgerTxn = userLedgerTxns[0]
  const walletId = ledgerTxn.walletId
  if (!(walletId && userLedgerTxns.length === 1)) {
    return new InvalidLedgerTransactionStateError()
  }

  const wallet = await WalletsRepository().findById(walletId)
  if (wallet instanceof Error) return wallet
  const account = await AccountsRepository().findById(wallet.accountId)
  if (account instanceof Error) return account
  const user = await UsersRepository().findById(account.kratosUserId)
  if (user instanceof Error) return user

  const amountForPaymentAmount =
    wallet.currency === WalletCurrency.Btc ? ledgerTxn.satsAmount : ledgerTxn.centsAmount
  if (amountForPaymentAmount === undefined) {
    return new InvalidLedgerTransactionStateError()
  }
  const paymentAmount = paymentAmountFromNumber({
    amount: amountForPaymentAmount,
    currency: wallet.currency,
  })
  if (paymentAmount instanceof Error) return paymentAmount

  const { displayAmount, displayCurrency } = ledgerTxn
  if (displayCurrency === undefined) return new InvalidLedgerTransactionStateError()
  const displayPaymentAmount = displayAmountFromNumber({
    amount: displayAmount || 0,
    currency: displayCurrency,
  })
  if (displayPaymentAmount instanceof Error) return displayPaymentAmount

  const { txHash } = ledgerTxn
  if (txHash === undefined) return new InvalidLedgerTransactionStateError()

  await NotificationsService().onChainTxSent({
    senderAccountId: wallet.accountId,
    senderWalletId: wallet.id,
    // TODO: tx.tokens represent the total sum, need to segregate amount by address
    paymentAmount,
    displayPaymentAmount,
    txHash,
    senderDeviceTokens: user.deviceTokens,
    senderLanguage: user.language,
  })

  return true
}
