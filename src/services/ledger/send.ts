import { LedgerTransactionType } from "@domain/ledger"
import { NotImplementedError } from "@domain/errors"
import {
  LedgerError,
  LedgerServiceError,
  NoTransactionToSettleError,
  UnknownLedgerError,
} from "@domain/ledger/errors"

import { WalletCurrency } from "@domain/shared"

import {
  EntryBuilder,
  toLedgerAccountId,
  paymentAmountFromSats,
  paymentAmountFromCents,
} from "./domain"

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
    } else {
      return addSendNoInternalFee({
        walletId,
        walletCurrency,
        metadata,
        description,
        sats,
      })
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

  if (walletCurrency === WalletCurrency.Btc) {
    const metadata = { ...metaInput, currency: WalletCurrency.Btc }

    try {
      const result = EntryBuilder({
        staticAccountIds,
        entry: MainBook.entry(description),
        metadata,
      })
        .withoutFee()
        .debitAccount({
          accountId,
          amount: paymentAmountFromSats(sats),
        })
        .creditLnd()

      const savedEntry = await result.commit()
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
  } else {
    try {
      if (cents === undefined) {
        return new UnknownLedgerError("Cents are required")
      }

      const entry = MainBook.entry(description)
      const result = EntryBuilder({
        staticAccountIds,
        entry,
        metadata: metaInput,
      })
        .withoutFee()

        .debitAccount({
          accountId,
          amount: paymentAmountFromCents(cents),
        })
        .creditLnd(paymentAmountFromSats(sats))

      const savedEntry = await result.commit()
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
  const accountId = toLedgerAccountId(walletId)
  const staticAccountIds = {
    bankOwnerAccountId: toLedgerAccountId(await caching.getBankOwnerWalletId()),
    dealerBtcAccountId: toLedgerAccountId(await caching.getDealerBtcWalletId()),
    dealerUsdAccountId: toLedgerAccountId(await caching.getDealerUsdWalletId()),
  }

  // TODO: remove once implemented
  if (walletCurrency !== WalletCurrency.Btc) {
    return new NotImplementedError("USD Intraledger")
  }

  try {
    const entry = MainBook.entry(description)
    const result = EntryBuilder({
      staticAccountIds,
      entry,
      metadata: metaInput,
    })
      .withFee({ btc: paymentAmountFromSats(fee) })
      .debitAccount({ accountId, amount: paymentAmountFromSats(sats) })
      .creditLnd()

    const savedEntry = await result.commit()
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
