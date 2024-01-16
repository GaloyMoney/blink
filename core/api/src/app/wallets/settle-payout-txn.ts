import { getTransactionForWalletByJournalId } from "./get-transaction-by-journal-id"

import { removeDeviceTokens } from "@/app/users/remove-device-tokens"

import { displayAmountFromNumber } from "@/domain/fiat"
import { InvalidLedgerTransactionStateError } from "@/domain/errors"
import { WalletCurrency, paymentAmountFromNumber } from "@/domain/shared"
import { DeviceTokensNotRegisteredNotificationsServiceError } from "@/domain/notifications"

import * as LedgerFacade from "@/services/ledger/facade"
import {
  AccountsRepository,
  UsersRepository,
  WalletsRepository,
} from "@/services/mongoose"
import { NotificationsService } from "@/services/notifications"

export const settlePayout = async (
  payoutId: PayoutId,
): Promise<true | ApplicationError> => {
  // Settle transaction in ledger
  const ledgerTxn = await LedgerFacade.settlePendingOnChainPayment(payoutId)
  if (ledgerTxn instanceof Error) return ledgerTxn
  if (ledgerTxn === undefined) return true

  // Send notification to end user
  if (ledgerTxn.walletId === undefined) return new InvalidLedgerTransactionStateError()
  const wallet = await WalletsRepository().findById(ledgerTxn.walletId)
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

  const walletTransaction = await getTransactionForWalletByJournalId({
    walletId: wallet.id,
    journalId: ledgerTxn.journalId,
  })
  if (walletTransaction instanceof Error) return walletTransaction

  const result = await NotificationsService().sendTransaction({
    recipient: {
      accountId: wallet.accountId,
      walletId: wallet.id,
      deviceTokens: user.deviceTokens,
      language: user.language,
      userId: user.id,
      level: account.level,
    },
    transaction: walletTransaction,
  })

  if (result instanceof DeviceTokensNotRegisteredNotificationsServiceError) {
    await removeDeviceTokens({ userId: user.id, deviceTokens: result.tokens })
  }

  return true
}
