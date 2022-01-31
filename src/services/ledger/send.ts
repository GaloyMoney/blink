import { LedgerTransactionType, toLiabilitiesWalletId } from "@domain/ledger"
import {
  LedgerError,
  LedgerServiceError,
  NoTransactionToSettleError,
  UnknownLedgerError,
} from "@domain/ledger/errors"

import { lndAccountingPath } from "./accounts"
import { MainBook, Transaction } from "./books"
import * as caching from "./caching"

import { translateToLedgerJournal } from "."

export const send = {
  addLnTxSend: async ({
    walletId,
    paymentHash,
    description,
    sats,
    feeRouting,
    feeRoutingDisplayCurrency,
    pubkey,
    amountDisplayCurrency,
    feeKnownInAdvance,
  }: AddLnTxSendArgs): Promise<LedgerJournal | LedgerError> => {
    const liabilitiesWalletId = toLiabilitiesWalletId(walletId)

    let metadata: AddLnTxSendMetadata
    try {
      metadata = {
        type: LedgerTransactionType.Payment,
        pending: true,
        hash: paymentHash,
        fee: feeRouting,
        feeUsd: feeRoutingDisplayCurrency,
        usd: amountDisplayCurrency,
        pubkey,
        feeKnownInAdvance,
        currency: "BTC",
      }

      const entry = MainBook.entry(description)

      entry
        .credit(lndAccountingPath, sats, metadata)
        .debit(liabilitiesWalletId, sats, metadata)

      const savedEntry = await entry.commit()
      return translateToLedgerJournal(savedEntry)
    } catch (err) {
      return new UnknownLedgerError(err)
    }
  },

  addOnChainTxSend: async ({
    walletId,
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
    const liabilitiesWalletId = toLiabilitiesWalletId(walletId)
    let metadata: AddOnchainTxSendMetadata
    try {
      metadata = {
        type: LedgerTransactionType.OnchainPayment,
        pending: true,
        hash: txHash,
        payee_addresses: [payeeAddress],
        fee: totalFee,
        feeUsd: totalFeeDisplayCurrency,
        usd: amountDisplayCurrency,
        sendAll,
        currency: "BTC",
      }

      const entry = MainBook.entry(description)
      entry
        .credit(lndAccountingPath, sats - bankFee, metadata)
        .debit(liabilitiesWalletId, sats, metadata)

      if (bankFee > 0) {
        const bankOwnerWalletId = await caching.getBankOwnerWalletId()
        const bankOwnerPath = toLiabilitiesWalletId(bankOwnerWalletId)

        entry.credit(bankOwnerPath, bankFee, metadata)
      }

      const savedEntry = await entry.commit()
      return translateToLedgerJournal(savedEntry)
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
