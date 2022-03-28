import { LedgerTransactionType } from "@domain/ledger"
import { NotImplementedError } from "@domain/errors"
import {
  LedgerError,
  LedgerServiceError,
  NoTransactionToSettleError,
  UnknownLedgerError,
} from "@domain/ledger/errors"
import {
  paymentAmountFromSats,
  paymentAmountFromCents,
  WalletCurrency,
} from "@domain/shared"

import { LegacyEntryBuilder, toLedgerAccountId } from "./domain"

import { MainBook, Transaction } from "./books"
import * as caching from "./caching"

import { TransactionsMetadataRepository } from "./services"

import { translateToLedgerJournal } from "."

const txMetadataRepo = TransactionsMetadataRepository()

export const send = {
  addLnTxSend: async ({
    walletId,
    walletCurrency,
    paymentHash,
    description,
    sats,
    feeRouting,
    feeRoutingDisplayCurrency,
    pubkey,
    amountDisplayCurrency,
    feeKnownInAdvance,
    cents,
  }: AddLnTxSendArgs): Promise<LedgerJournal | LedgerError> => {
    const metadata: AddLnSendLedgerMetadata = {
      type: LedgerTransactionType.Payment,
      pending: true,
      hash: paymentHash,
      fee: feeRouting,
      feeUsd: feeRoutingDisplayCurrency,
      usd: amountDisplayCurrency,
      pubkey,
      feeKnownInAdvance,
    }
    return addSendNoInternalFee({
      walletId,
      walletCurrency,
      metadata,
      description,
      sats,
      cents,
    })
  },

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
      const success = result.nModified > 0
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
      const success = result.nModified > 0
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

  if (walletCurrency === WalletCurrency.Btc) {
    entry = builder
      .debitAccount({
        accountId,
        amount: paymentAmountFromSats(sats),
      })
      .creditLnd()
  }

  if (walletCurrency === WalletCurrency.Usd) {
    if (!cents) return new UnknownLedgerError("Cents are required")

    entry = builder
      .debitAccount({
        accountId,
        amount: paymentAmountFromCents(cents),
      })
      .creditLnd(paymentAmountFromSats(sats))
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
    const entry = MainBook.entry(description)
    const builder = LegacyEntryBuilder({
      staticAccountIds,
      entry,
      metadata: metaInput,
    })
      .withFee(paymentAmountFromSats(fee))
      .debitAccount({ accountId, amount: paymentAmountFromSats(sats) })
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
