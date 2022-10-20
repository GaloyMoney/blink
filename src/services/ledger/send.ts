import { LedgerTransactionType } from "@domain/ledger"
import { NotImplementedError } from "@domain/errors"
import {
  LedgerServiceError,
  NoTransactionToSettleError,
  UnknownLedgerError,
} from "@domain/ledger/errors"
import { WalletCurrency, paymentAmountFromNumber } from "@domain/shared"

import { LegacyEntryBuilder, toLedgerAccountId } from "./domain"

import { MainBook, Transaction } from "./books"
import * as caching from "./caching"

import { TransactionsMetadataRepository } from "./services"

import { persistAndReturnEntry } from "./helpers"

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
  }: RevertLightningPaymentArgs): Promise<void | LedgerServiceError> => {
    const reason = "Payment canceled"
    try {
      const savedEntry = await MainBook.void(journalId, reason)
      const journalEntry = translateToLedgerJournal(savedEntry)

      const txsMetadataToPersist = journalEntry.transactionIds.map((id) => ({
        id,
        hash: paymentHash,
      }))
      txMetadataRepo.persistAll(txsMetadataToPersist)
    } catch (err) {
      return new UnknownLedgerError(err)
    }
  },
}

const buildSendNoInternalFeeEntry = async ({
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

  return entry
}

const addSendNoInternalFee = async (args: {
  metadata: AddLnSendLedgerMetadata | AddOnchainSendLedgerMetadata
  walletId: WalletId
  walletCurrency: WalletCurrency
  sats: Satoshis
  cents?: UsdCents
  description: string
}) => {
  const entry = await buildSendNoInternalFeeEntry(args)
  if (entry instanceof Error) return entry

  return persistAndReturnEntry({ entry, hash: args.metadata.hash })
}

const buildSendInternalFeeEntry = async ({
  metadata: metaInput,
  walletId,
  sats,
  fee,
  description,
}: {
  metadata: AddOnchainSendLedgerMetadata
  walletId: WalletId
  sats: Satoshis
  fee: Satoshis
  description: string
}) => {
  const accountId = toLedgerAccountId(walletId)
  const staticAccountIds = {
    bankOwnerAccountId: toLedgerAccountId(await caching.getBankOwnerWalletId()),
    dealerBtcAccountId: toLedgerAccountId(await caching.getDealerBtcWalletId()),
    dealerUsdAccountId: toLedgerAccountId(await caching.getDealerUsdWalletId()),
  }

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

  let entry = MainBook.entry(description)
  const builder = LegacyEntryBuilder({
    staticAccountIds,
    entry,
    metadata: metaInput,
  }).withFee(feeSatsAmount)

  entry = builder
    .debitAccount({
      accountId,
      amount: satsAmount,
    })
    .creditLnd()

  return entry
}

const addSendInternalFee = async (args: {
  metadata: AddOnchainSendLedgerMetadata
  walletId: WalletId
  walletCurrency: WalletCurrency
  sats: Satoshis
  fee: Satoshis
  description: string
}) => {
  // TODO: remove once implemented
  if (args.walletCurrency !== WalletCurrency.Btc) {
    return new NotImplementedError("USD Intraledger")
  }

  const entry = await buildSendInternalFeeEntry(args)
  if (entry instanceof Error) return entry

  return persistAndReturnEntry({ entry, hash: args.metadata.hash })
}
