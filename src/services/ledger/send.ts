import assert from "assert"

import { LedgerTransactionType, toLiabilitiesWalletId } from "@domain/ledger"
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

import { translateToLedgerJournal } from "."

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

  revertLightningPayment: async (
    // TODO: manage currency conversion in case of USD wallet
    journalId: LedgerJournalId,
  ): Promise<void | LedgerServiceError> => voidLedgerTransactionsByJournalId(journalId),
}

const voidLedgerTransactionsByJournalId = async (
  journalId: LedgerJournalId,
): Promise<void | LedgerServiceError> => {
  const reason = "Payment canceled"
  try {
    await MainBook.void(journalId, reason)
  } catch (err) {
    return new UnknownLedgerError(err)
  }
}

const addSendNoInternalFee = async ({
  metadata: metaInput,
  walletId,
  walletCurrency,
  sats,
  description,
}: {
  metadata: AddLnSendLedgerMetadata | AddOnchainSendLedgerMetadata
  walletId: WalletId
  walletCurrency: WalletCurrency
  sats: Satoshis
  description: string
}) => {
  const liabilitiesWalletId = toLiabilitiesWalletId(walletId)

  // TODO: remove once implemented
  assert(walletCurrency === WalletCurrency.Btc)

  const metadata = { ...metaInput, currency: WalletCurrency.Btc }

  try {
    const entry = MainBook.entry(description)
      .credit(lndAccountingPath, sats, metadata)
      .debit(liabilitiesWalletId, sats, metadata)

    const savedEntry = await entry.commit()
    return translateToLedgerJournal(savedEntry)
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
  const liabilitiesWalletId = toLiabilitiesWalletId(walletId)
  const bankOwnerWalletId = await caching.getBankOwnerWalletId()
  const bankOwnerPath = toLiabilitiesWalletId(bankOwnerWalletId)

  // TODO: remove once implemented
  assert(walletCurrency === WalletCurrency.Btc)

  const metadata = { ...metaInput, currency: WalletCurrency.Btc }

  try {
    const entry = MainBook.entry(description)
      .credit(lndAccountingPath, sats - fee, metadata)
      .debit(liabilitiesWalletId, sats, metadata)
      .credit(bankOwnerPath, fee, metadata)

    const savedEntry = await entry.commit()
    return translateToLedgerJournal(savedEntry)
  } catch (err) {
    return new UnknownLedgerError(err)
  }
}
