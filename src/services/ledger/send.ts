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
      // TODO: remove once implemented
      if (walletCurrency !== WalletCurrency.Btc) {
        return new NotImplementedError("USD Intraledger")
      }

      const entry = await buildSendInternalFeeEntry({
        walletId,
        metadata,
        description,
        sats,
        fee: bankFee,
      })
      if (entry instanceof Error) return entry

      return persistAndReturnEntry({ entry, hash: metadata.hash })
    }

    const entry = await buildSendNoInternalFeeEntry({
      walletId,
      walletCurrency,
      metadata,
      description,
      sats,
    })
    if (entry instanceof Error) return entry

    return persistAndReturnEntry({ entry, hash: metadata.hash })
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

  // Start entry
  let entry = MainBook.entry(description)
  const builder = LegacyEntryBuilder({
    staticAccountIds,
    entry,
    metadata: { ...metaInput, currency: walletCurrency },
  }).withoutFee()

  // Calculate amounts
  const satsAmount = paymentAmountFromNumber({
    amount: sats,
    currency: WalletCurrency.Btc,
  })
  if (satsAmount instanceof Error) return satsAmount

  let centsAmount: UsdPaymentAmount | ValidationError | undefined = undefined
  if (walletCurrency === WalletCurrency.Usd) {
    if (!cents) return new UnknownLedgerError("Cents are required")
    centsAmount = paymentAmountFromNumber({
      amount: cents,
      currency: WalletCurrency.Usd,
    })
    if (centsAmount instanceof Error) return centsAmount
  }

  // Complete entry
  entry = centsAmount
    ? builder
        .debitAccount({
          accountId,
          amount: centsAmount,
        })
        .creditLnd(satsAmount)
    : builder
        .debitAccount({
          accountId,
          amount: satsAmount,
        })
        .creditLnd()

  return entry
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

  // Start entry
  let entry = MainBook.entry(description)
  const builder = LegacyEntryBuilder({
    staticAccountIds,
    entry,
    metadata: metaInput,
  })

  // Calculate amounts
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

  // Complete entry
  entry = builder
    .withFee(feeSatsAmount)
    .debitAccount({
      accountId,
      amount: satsAmount,
    })
    .creditLnd()

  return entry
}
