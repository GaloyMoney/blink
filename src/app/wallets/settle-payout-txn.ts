import { InvalidLedgerTransactionStateError } from "@domain/errors"
import { WalletCurrency, paymentAmountFromNumber } from "@domain/shared"
import { displayAmountFromNumber } from "@domain/fiat"

import * as LedgerFacade from "@services/ledger/facade"
import {
  AccountsRepository,
  UsersRepository,
  WalletsRepository,
} from "@services/mongoose"
import { NotificationsService } from "@services/notifications"

export const settlePayout = async (
  payoutId: PayoutId,
): Promise<true | ApplicationError> => {
  const ledgerTxn = await LedgerFacade.settlePendingOnChainPayment(payoutId)
  if (ledgerTxn instanceof Error) return ledgerTxn
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

  await NotificationsService().onChainTxSent({
    senderAccountId: wallet.accountId,
    senderWalletId: wallet.id,
    paymentAmount,
    displayPaymentAmount,
    txHash,
    senderDeviceTokens: user.deviceTokens,
    senderLanguage: user.language,
  })

  return true
}
