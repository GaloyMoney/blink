import { BTC_NETWORK, ONCHAIN_SCAN_DEPTH } from "@config"

import { InvalidWalletId } from "@domain/errors"
import { paymentAmountFromNumber } from "@domain/shared"
import { translateLedgerTxnToWalletTxn } from "@domain/wallets/tx-history"
import { TxDecoder, UnconfirmedOnChainTxError } from "@domain/bitcoin/onchain"
import { CouldNotFindTransactionError, LedgerTransactionType } from "@domain/ledger"

import { OnChainService } from "@services/lnd/onchain-service"
import { NotificationsService } from "@services/notifications"
import { getNonEndUserWalletIds, LedgerService } from "@services/ledger"
import {
  AccountsRepository,
  UsersRepository,
  WalletsRepository,
} from "@services/mongoose"
import { DisplayCurrency } from "@domain/fiat"

export const updateOnChainPaymentsByTxHash = async ({
  txHash,
  scanDepth = ONCHAIN_SCAN_DEPTH,
  logger,
}: {
  txHash: OnChainTxHash
  scanDepth?: ScanDepth
  logger: Logger
}): Promise<true | ApplicationError> => {
  const onChainService = OnChainService(TxDecoder(BTC_NETWORK))
  if (onChainService instanceof Error) return onChainService

  const tx = await onChainService.lookupOnChainPayment({ txHash, scanDepth })
  if (tx instanceof Error) return tx

  // we have to return here because we will not know whose user the the txid belong to
  // this is because of limitation for lnd onchain wallet. we only know the txid after the
  // transaction has been sent and this event is trigger before
  if (tx.confirmations === 0) return new UnconfirmedOnChainTxError()

  const settled = await LedgerService().settlePendingOnChainPayment({ txHash })
  if (settled instanceof Error) return settled

  logger.info(
    { success: true, pending: false, transactionType: "payment" },
    "payment completed",
  )

  const ledgerTxns = await LedgerService().getTransactionsByHash(txHash)
  if (ledgerTxns instanceof Error) return ledgerTxns

  const nonEndUserWalletIds = Object.values(await getNonEndUserWalletIds())
  const payments = ledgerTxns.filter(
    (tx) =>
      tx.txHash === txHash &&
      tx.type === LedgerTransactionType.OnchainPayment &&
      tx.debit > 0 &&
      tx.walletId !== undefined &&
      !nonEndUserWalletIds.includes(tx.walletId),
  )
  if (!payments || payments.length === 0) return new CouldNotFindTransactionError()

  for (const payment of payments) {
    const sent = await sendOnChainTxSentNotification({ payment })
    if (sent instanceof Error) {
      logger.error({ payment, error: sent }, "Error sending notification")
    }
  }

  return true
}

const sendOnChainTxSentNotification = async ({
  payment,
}: {
  payment: LedgerTransaction<WalletCurrency>
}): Promise<true | ApplicationError> => {
  if (!payment.walletId) return new InvalidWalletId()

  const senderWallet = await WalletsRepository().findById(payment.walletId)
  if (senderWallet instanceof Error) return senderWallet

  const senderAccount = await AccountsRepository().findById(senderWallet.accountId)
  if (senderAccount instanceof Error) return senderAccount

  const senderUser = await UsersRepository().findById(senderAccount.ownerId)
  if (senderUser instanceof Error) return senderUser

  const walletTx = translateLedgerTxnToWalletTxn(payment)
  const paymentAmount = paymentAmountFromNumber({
    amount: walletTx.settlementAmount * -1 - walletTx.settlementFee,
    currency: walletTx.settlementCurrency,
  })
  if (paymentAmount instanceof Error) return paymentAmount

  let displayPaymentAmount: DisplayPaymentAmount<DisplayCurrency> = {
    amount: payment.usd - payment.feeUsd,
    currency: DisplayCurrency.Usd,
  }
  if (payment.displayAmount && payment.displayCurrency) {
    displayPaymentAmount = {
      amount: payment.displayAmount,
      currency: payment.displayCurrency,
    }
  }

  const result = await NotificationsService().onChainTxSent({
    senderAccountId: senderWallet.accountId,
    senderWalletId: senderWallet.id,
    paymentAmount,
    displayPaymentAmount,
    txHash: payment.txHash || ("" as OnChainTxHash),
    senderDeviceTokens: senderUser.deviceTokens,
    senderLanguage: senderUser.language,
  })
  if (result instanceof Error) return result

  return true
}
