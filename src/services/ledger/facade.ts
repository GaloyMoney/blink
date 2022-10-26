import {
  ZERO_BANK_FEE,
  AmountCalculator,
  ZERO_CENTS,
  ZERO_SATS,
  paymentAmountFromNumber,
} from "@domain/shared"

import { MainBook, Transaction } from "./books"
import { toLedgerAccountDescriptor, toLedgerAccountId, EntryBuilder } from "./domain"
import { persistAndReturnEntry } from "./helpers"
import * as caching from "./caching"
import { TransactionsMetadataRepository } from "./services"

import { NoTransactionToSettleError, UnknownLedgerError } from "./domain/errors"

import { translateToLedgerJournal } from "."

export * from "./tx-metadata"

const calc = AmountCalculator()

const txMetadataRepo = TransactionsMetadataRepository()

const staticAccountIds = async () => {
  return {
    bankOwnerAccountId: toLedgerAccountId(await caching.getBankOwnerWalletId()),
    dealerBtcAccountId: toLedgerAccountId(await caching.getDealerBtcWalletId()),
    dealerUsdAccountId: toLedgerAccountId(await caching.getDealerUsdWalletId()),
  }
}

export const recordSend = async ({
  description,
  senderWalletDescriptor,
  amountToDebitSender,
  bankFee,
  metadata,
}: RecordSendArgs) => {
  const actualFee = bankFee || { usd: ZERO_CENTS, btc: ZERO_SATS }

  let entry = MainBook.entry(description)
  const builder = EntryBuilder({
    staticAccountIds: await staticAccountIds(),
    entry,
    metadata,
  })

  entry = builder
    .withTotalAmount({
      usdWithFees: amountToDebitSender.usd,
      btcWithFees: amountToDebitSender.btc,
    })
    .withBankFee({ usdBankFee: actualFee.usd, btcBankFee: actualFee.btc })
    .debitAccount({
      accountDescriptor: toLedgerAccountDescriptor(senderWalletDescriptor),
    })
    .creditLnd()

  return persistAndReturnEntry({ entry, hash: metadata.hash })
}

export const recordReceive = async ({
  description,
  recipientWalletDescriptor,
  amountToCreditReceiver,
  bankFee,
  metadata,
  txMetadata,
}: RecordReceiveArgs) => {
  const actualFee = bankFee || { usd: ZERO_CENTS, btc: ZERO_SATS }

  let entry = MainBook.entry(description)
  const builder = EntryBuilder({
    staticAccountIds: await staticAccountIds(),
    entry,
    metadata,
  })

  const amountWithFees = {
    usdWithFees: calc.add(amountToCreditReceiver.usd, actualFee.usd),
    btcWithFees: calc.add(amountToCreditReceiver.btc, actualFee.btc),
  }

  entry = builder
    .withTotalAmount(amountWithFees)
    .withBankFee({ usdBankFee: actualFee.usd, btcBankFee: actualFee.btc })
    .debitLnd()
    .creditAccount(toLedgerAccountDescriptor(recipientWalletDescriptor))

  return persistAndReturnEntry({ entry, ...txMetadata })
}

export const getLedgerAccountBalanceForWalletId = async <T extends WalletCurrency>({
  id: walletId,
  currency,
}: WalletDescriptor<T>): Promise<PaymentAmount<T> | LedgerError> => {
  try {
    const { balance } = await MainBook.balance({
      account: toLedgerAccountId(walletId),
    })
    return paymentAmountFromNumber({ amount: balance, currency })
  } catch (err) {
    return new UnknownLedgerError(err)
  }
}

export const recordIntraledger = async ({
  description,
  senderWalletDescriptor,
  recipientWalletDescriptor,
  amount,
  metadata,
  additionalDebitMetadata: additionalMetadata,
}: RecordIntraledgerArgs) => {
  let entry = MainBook.entry(description)
  const builder = EntryBuilder({
    staticAccountIds: await staticAccountIds(),
    entry,
    metadata,
  })

  entry = builder
    .withTotalAmount({ usdWithFees: amount.usd, btcWithFees: amount.btc })
    .withBankFee(ZERO_BANK_FEE)
    .debitAccount({
      accountDescriptor: toLedgerAccountDescriptor(senderWalletDescriptor),
      additionalMetadata,
    })
    .creditAccount(toLedgerAccountDescriptor(recipientWalletDescriptor))

  return persistAndReturnEntry({
    entry,
    hash: "hash" in metadata ? metadata.hash : undefined,
  })
}

export const settlePendingLnSend = async (
  paymentHash: PaymentHash,
): Promise<true | LedgerServiceError> => {
  try {
    const result = await Transaction.updateMany({ hash: paymentHash }, { pending: false })
    const success = result.modifiedCount > 0
    if (!success) {
      return new NoTransactionToSettleError()
    }
    return true
  } catch (err) {
    return new UnknownLedgerError(err)
  }
}

export const recordLnSendRevert = async ({
  journalId,
  paymentHash,
}: RevertLightningPaymentArgs): Promise<true | LedgerServiceError> => {
  const reason = "Payment canceled"
  try {
    const savedEntry = await MainBook.void(journalId, reason)
    const journalEntry = translateToLedgerJournal(savedEntry)

    const txsMetadataToPersist = journalEntry.transactionIds.map((id) => ({
      id,
      hash: paymentHash,
    }))
    txMetadataRepo.persistAll(txsMetadataToPersist)
    return true
  } catch (err) {
    return new UnknownLedgerError(err)
  }
}

export const updateMetadataByHash = async (
  ledgerTxMetadata:
    | OnChainLedgerTransactionMetadataUpdate
    | LnLedgerTransactionMetadataUpdate,
): Promise<true | LedgerServiceError | RepositoryError> =>
  TransactionsMetadataRepository().updateByHash(ledgerTxMetadata)
