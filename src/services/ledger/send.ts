import { LedgerTransactionType } from "@domain/ledger"
import { NotImplementedError, NoTransactionToUpdateError } from "@domain/errors"
import {
  LedgerServiceError,
  NoTransactionToSettleError,
  UnknownLedgerError,
} from "@domain/ledger/errors"
import { WalletCurrency, paymentAmountFromNumber } from "@domain/shared"

import { toObjectId } from "@services/mongoose/utils"

import { LegacyEntryBuilder, toLedgerAccountId } from "./domain"

import { MainBook, Transaction } from "./books"
import * as caching from "./caching"

import { TransactionsMetadataRepository } from "./services"

import { translateToLedgerJournal } from "."

const txMetadataRepo = TransactionsMetadataRepository()

export const send = {
  addOnChainTxSend: async ({
    walletId,
    walletCurrency,
    txHash,
    payeeAddress,
    description,
    sats,
    bankFee,
    amountDisplayCurrency,
    totalFee,
    totalFeeDisplayCurrency,
    sendAll,
  }: AddOnChainTxSendArgs): Promise<LedgerJournal | LedgerServiceError> => {
    const metadata: AddOnchainSendLedgerMetadata = {
      type: LedgerTransactionType.OnchainPayment,
      pending: true,
      hash: txHash,
      payee_addresses: [payeeAddress],
      fee: totalFee,
      feeUsd: totalFeeDisplayCurrency,
      usd: amountDisplayCurrency,
      sendAll,
    }

    if (bankFee > 0) {
      return addSendInternalFee({
        walletId,
        walletCurrency,
        metadata,
        description,
        sats,
        fee: bankFee,
      })
    }

    return addSendNoInternalFee({
      walletId,
      walletCurrency,
      metadata,
      description,
      sats,
    })
  },

  setOnChainTxSendHash: async ({
    journalId,
    newTxHash,
  }: SetOnChainTxSendHashArgs): Promise<true | LedgerServiceError> => {
    try {
      const result = await Transaction.updateMany(
        { _journal: toObjectId(journalId) },
        { hash: newTxHash },
      )
      const success = result.modifiedCount > 0
      if (!success) {
        return new NoTransactionToUpdateError()
      }
      return true
    } catch (err) {
      return new UnknownLedgerError(err)
    }
  },

  settlePendingLnPayment: async (
    paymentHash: PaymentHash,
  ): Promise<true | LedgerServiceError> => {
    try {
      const result = await Transaction.updateMany(
        { hash: paymentHash },
        { pending: false },
      )
      const success = result.modifiedCount > 0
      if (!success) {
        return new NoTransactionToSettleError()
      }
      return true
    } catch (err) {
      return new UnknownLedgerError(err)
    }
  },

  settlePendingOnChainPayment: async (
    hash: OnChainTxHash,
  ): Promise<true | LedgerServiceError> => {
    try {
      const result = await Transaction.updateMany({ hash }, { pending: false })
      const success = result.modifiedCount > 0
      if (!success) {
        return new NoTransactionToSettleError()
      }
      return true
    } catch (err) {
      return new UnknownLedgerError(err)
    }
  },

  revertLightningPayment: async ({
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
  },

  revertOnChainPayment: async ({
    journalId,
    description = "Protocol error",
  }: RevertOnChainPaymentArgs): Promise<true | LedgerServiceError> => {
    try {
      // pending update must be before void to avoid pending voided records
      await Transaction.updateMany(
        { _journal: toObjectId(journalId) },
        { pending: false },
      )

      await MainBook.void(journalId, description)
      // TODO: persist to metadata
      return true
    } catch (err) {
      return new UnknownLedgerError(err)
    }
  },
}

const addSendNoInternalFee = async ({
  metadata: metaInput,
  walletId,
  walletCurrency,
  sats,
  cents,
  description,
}: {
  metadata: AddLnSendLedgerMetadata | AddOnchainSendLedgerMetadata
  walletId: WalletId
  walletCurrency: WalletCurrency
  sats: Satoshis
  cents?: UsdCents
  description: string
}) => {
  const accountId = toLedgerAccountId(walletId)
  const staticAccountIds = {
    bankOwnerAccountId: toLedgerAccountId(await caching.getBankOwnerWalletId()),
    dealerBtcAccountId: toLedgerAccountId(await caching.getDealerBtcWalletId()),
    dealerUsdAccountId: toLedgerAccountId(await caching.getDealerUsdWalletId()),
  }

  const metadata = { ...metaInput, currency: walletCurrency }
  let entry = MainBook.entry(description)
  const builder = LegacyEntryBuilder({
    staticAccountIds,
    entry,
    metadata,
  }).withoutFee()

  const satsAmount = paymentAmountFromNumber({
    amount: sats,
    currency: WalletCurrency.Btc,
  })
  if (satsAmount instanceof Error) return satsAmount

  if (walletCurrency === WalletCurrency.Btc) {
    entry = builder
      .debitAccount({
        accountId,
        amount: satsAmount,
      })
      .creditLnd()
  }

  if (walletCurrency === WalletCurrency.Usd) {
    if (!cents) return new UnknownLedgerError("Cents are required")
    const centsAmount = paymentAmountFromNumber({
      amount: cents,
      currency: WalletCurrency.Usd,
    })
    if (centsAmount instanceof Error) return centsAmount

    entry = builder
      .debitAccount({
        accountId,
        amount: centsAmount,
      })
      .creditLnd(satsAmount)
  }

  try {
    const savedEntry = await entry.commit()
    const journalEntry = translateToLedgerJournal(savedEntry)

    const txsMetadataToPersist = journalEntry.transactionIds.map((id) => ({
      id,
      hash: metadata.hash,
    }))
    txMetadataRepo.persistAll(txsMetadataToPersist)

    return journalEntry
  } catch (err) {
    return new UnknownLedgerError(err)
  }
}

const addSendInternalFee = async ({
  metadata: metaInput,
  walletId,
  walletCurrency,
  sats,
  fee,
  description,
}: {
  metadata: AddOnchainSendLedgerMetadata
  walletId: WalletId
  walletCurrency: WalletCurrency
  sats: Satoshis
  fee: Satoshis
  description: string
}) => {
  // TODO: remove once implemented
  if (walletCurrency !== WalletCurrency.Btc) {
    return new NotImplementedError("USD Intraledger")
  }

  const accountId = toLedgerAccountId(walletId)
  const staticAccountIds = {
    bankOwnerAccountId: toLedgerAccountId(await caching.getBankOwnerWalletId()),
    dealerBtcAccountId: toLedgerAccountId(await caching.getDealerBtcWalletId()),
    dealerUsdAccountId: toLedgerAccountId(await caching.getDealerUsdWalletId()),
  }

  try {
    const feeSatsAmount = paymentAmountFromNumber({
      amount: fee,
      currency: WalletCurrency.Btc,
    })
    if (feeSatsAmount instanceof Error) return feeSatsAmount
    const satsAmount = paymentAmountFromNumber({
      amount: sats,
      currency: WalletCurrency.Btc,
    })
    if (satsAmount instanceof Error) return satsAmount

    const entry = MainBook.entry(description)
    const builder = LegacyEntryBuilder({
      staticAccountIds,
      entry,
      metadata: metaInput,
    })
      .withFee(feeSatsAmount)
      .debitAccount({ accountId, amount: satsAmount })
      .creditLnd()

    const savedEntry = await builder.commit()
    const journalEntry = translateToLedgerJournal(savedEntry)

    const txsMetadataToPersist = journalEntry.transactionIds.map((id) => ({
      id,
      hash: metaInput.hash,
    }))
    txMetadataRepo.persistAll(txsMetadataToPersist)

    return journalEntry
  } catch (err) {
    return new UnknownLedgerError(err)
  }
}
