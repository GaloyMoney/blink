/**
 * an accounting reminder:
 * https://en.wikipedia.org/wiki/Double-entry_bookkeeping
 */

import * as accounts from "./accounts"
import * as queries from "./query"
import * as transactions from "./transaction"

type LoadLedgerParams = {
  bankOwnerAccountResolver: () => Promise<string>
  dealerAccountResolver: () => Promise<string>
}

export const loadLedger = ({
  bankOwnerAccountResolver,
  dealerAccountResolver,
}: LoadLedgerParams) => {
  accounts.setBankOwnerAccountResolver(bankOwnerAccountResolver)
  accounts.setDealerAccountResolver(dealerAccountResolver)
  return {
    ...accounts,
    ...queries,
    ...transactions,
  }
}

import {
  UnknownLedgerError,
  LedgerError,
  LedgerServiceError,
} from "@domain/ledger/errors"
import { MainBook } from "./books"
import { Transaction } from "./schema"
import { toSats } from "@domain/bitcoin"
import { LedgerTransactionType } from "@domain/ledger"
import { lndAccountingPath, bankOwnerAccountPath } from "./accounts"

export const LedgerService = (): ILedgerService => {
  const getLiabilityTransactions = async (
    liabilitiesAccountId: LiabilitiesAccountId,
  ): Promise<LedgerTransaction[] | LedgerError> => {
    try {
      const { results } = await MainBook.ledger({ account: liabilitiesAccountId })
      // translate raw schema result -> LedgerTransaction
      return results.map((tx) => translateToLedgerTx(tx))
    } catch (err) {
      return new UnknownLedgerError(err)
    }
  }

  const listPendingPayments = async (
    liabilitiesAccountId: LiabilitiesAccountId,
  ): Promise<LedgerTransaction[] | LedgerError> => {
    try {
      const { results } = await MainBook.ledger({
        account: liabilitiesAccountId,
        type: LedgerTransactionType.Payment,
        pending: true,
      })
      // translate raw schema result -> LedgerTransaction
      return results.map((tx) => translateToLedgerTx(tx))
    } catch (err) {
      return new UnknownLedgerError(err)
    }
  }

  const getPendingPaymentsCount = async (
    liabilitiesAccountId: LiabilitiesAccountId,
  ): Promise<number | LedgerError> => {
    return Transaction.countDocuments({
      accounts: liabilitiesAccountId,
      type: "payment",
      pending: true,
    })
  }

  const isOnChainTxRecorded = async (
    liabilitiesAccountId: LiabilitiesAccountId,
    txId: TxId,
  ): Promise<boolean | LedgerServiceError> => {
    try {
      const result = await Transaction.countDocuments({
        accounts: liabilitiesAccountId,
        type: LedgerTransactionType.OnchainReceipt,
        hash: txId,
      })
      return result > 0
    } catch (err) {
      return new UnknownLedgerError(err)
    }
  }
  const receiveOnChainTx = async ({
    liabilitiesAccountId,
    txId,
    sats,
    fee,
    usd,
    usdFee,
    receivingAddress,
  }: ReceiveOnChainTxArgs) => {
    try {
      const metadata = {
        currency: "BTC",
        type: LedgerTransactionType.OnchainReceipt,
        pending: false,
        hash: txId,
        fee,
        usdFee,
        sats,
        usd,
        payee_addresses: [receivingAddress],
      }

      const entry = MainBook.entry("")
        .credit(liabilitiesAccountId, sats - fee, metadata)
        .debit(lndAccountingPath, sats, metadata)

      if (fee > 0) {
        const bankOwnerPath = await bankOwnerAccountPath()
        entry.credit(bankOwnerPath, fee, metadata)
      }

      await entry.commit()

      return
    } catch (err) {
      return new UnknownLedgerError(err)
    }
  }

  const receiveLnTx = async ({
    liabilitiesAccountId,
    paymentHash,
    description,
    sats,
    fee,
    usd,
    usdFee,
  }: ReceiveLnTxArgs): Promise<void | LedgerError> => {
    try {
      const metadata = {
        type: LedgerTransactionType.Invoice,
        pending: false,
        hash: paymentHash,
        fee,
        feeUsd: usdFee,
        sats,
        usd,
        currency: "BTC",
      }

      const entry = MainBook.entry(description)
      entry
        .credit(liabilitiesAccountId, sats - fee, metadata)
        .debit(lndAccountingPath, sats, metadata)

      if (fee > 0) {
        const bankOwnerPath = await bankOwnerAccountPath()
        entry.credit(bankOwnerPath, fee, metadata)
      }

      await entry.commit()
    } catch (err) {
      return new UnknownLedgerError(err)
    }
  }

  const receiveLnFeeReimbursement = async ({
    liabilitiesAccountId,
    paymentHash,
    sats,
    usd,
    journalId,
  }: ReceiveLnFeeReeimbursementArgs): Promise<void | LedgerError> => {
    try {
      const metadata = {
        type: LedgerTransactionType.LnFeeReimbursement,
        currency: "BTC",
        hash: paymentHash,
        related_journal: journalId,
        pending: false,
        usd,
      }

      const description = "fee reimbursement"
      const entry = MainBook.entry(description)
      entry
        .credit(liabilitiesAccountId, sats, metadata)
        .debit(lndAccountingPath, sats, metadata)

      await entry.commit()
    } catch (err) {
      return new UnknownLedgerError(err)
    }
  }

  const settlePendingLiabilityTransactions = async (
    paymentHash: PaymentHash,
  ): Promise<boolean | LedgerServiceError> => {
    try {
      const result = await Transaction.updateMany(
        { hash: paymentHash },
        { pending: false },
      )
      return result.nModified > 0
    } catch (err) {
      return new UnknownLedgerError(err)
    }
  }

  const voidLedgerTransactionsForJournal = async (
    journalId: LedgerJournalId,
  ): Promise<void | LedgerServiceError> => {
    const reason = "Payment canceled"
    try {
      await MainBook.void(journalId, reason)
    } catch (err) {
      return new UnknownLedgerError(err)
    }
  }

  return {
    getLiabilityTransactions,
    listPendingPayments,
    getPendingPaymentsCount,
    isOnChainTxRecorded,
    receiveOnChainTx,
    receiveLnTx,
    receiveLnFeeReimbursement,
    settlePendingLiabilityTransactions,
    voidLedgerTransactionsForJournal,
  }
}

const translateToLedgerTx = (tx): LedgerTransaction => ({
  id: tx.id,
  type: tx.type,
  debit: toSats(tx.debit),
  credit: toSats(tx.credit),
  fee: toSats(tx.fee),
  usd: tx.usd,
  feeUsd: tx.feeUsd,
  currency: tx.currency,
  timestamp: tx.timestamp,
  pendingConfirmation: tx.pending,
  journalId: tx._journal.toString(),
  lnMemo: tx.memo,
  walletName: tx.username,
  memoFromPayer: tx.memoPayer,
  paymentHash: tx.hash,
  pubkey: tx.pubkey,
  addresses: tx.payee_addresses,
  txId: tx.hash,
  feeKnownInAdvance: tx.feeKnownInAdvance || false,
})
