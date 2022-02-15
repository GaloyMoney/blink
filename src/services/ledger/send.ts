import { LedgerTransactionType, toLiabilitiesWalletId } from "@domain/ledger"
import { NotImplementedError } from "@domain/errors"
import {
  LedgerError,
  LedgerServiceError,
  NoTransactionToSettleError,
  UnknownLedgerError,
} from "@domain/ledger/errors"

import { WalletCurrency } from "@domain/wallets"

import { lndAccountingPath } from "./accounts"
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
  const liabilitiesWalletId = toLiabilitiesWalletId(walletId)

  if (walletCurrency === WalletCurrency.Btc) {
    const metadata = { ...metaInput, currency: WalletCurrency.Btc }

    try {
      const entry = MainBook.entry(description)
        .credit(lndAccountingPath, sats, metadata)
        .debit(liabilitiesWalletId, sats, metadata)

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
  } else {
    const dealerBtcWalletId = await caching.getDealerBtcWalletId()
    const dealerUsdWalletId = await caching.getDealerUsdWalletId()
    const liabilitiesDealerBtcWalletId = toLiabilitiesWalletId(dealerBtcWalletId)
    const liabilitiesDealerUsdWalletId = toLiabilitiesWalletId(dealerUsdWalletId)

    const metaBtc = {
      ...metaInput,
      currency: WalletCurrency.Btc,
    }

    const metaUsd = {
      ...metaInput,
      currency: WalletCurrency.Usd,
    }

    try {
      const entry = MainBook.entry(description)
      entry
        .credit(lndAccountingPath, sats, metaBtc)
        .debit(liabilitiesDealerBtcWalletId, sats, metaBtc)
        .credit(liabilitiesDealerUsdWalletId, cents, metaUsd)
        .debit(liabilitiesWalletId, cents, metaUsd)

      const savedEntry = await entry.commit()
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
  const liabilitiesWalletId = toLiabilitiesWalletId(walletId)
  const bankOwnerWalletId = await caching.getBankOwnerWalletId()
  const bankOwnerPath = toLiabilitiesWalletId(bankOwnerWalletId)

  // TODO: remove once implemented
  if (walletCurrency !== WalletCurrency.Btc) {
    return new NotImplementedError("USD Intraledger")
  }

  const metadata = { ...metaInput, currency: WalletCurrency.Btc }

  try {
    const entry = MainBook.entry(description)
      .credit(lndAccountingPath, sats - fee, metadata)
      .debit(liabilitiesWalletId, sats, metadata)
      .credit(bankOwnerPath, fee, metadata)

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
