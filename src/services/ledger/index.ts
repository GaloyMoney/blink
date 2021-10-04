/**
 * an accounting reminder:
 * https://en.wikipedia.org/wiki/Double-entry_bookkeeping
 */

// we have to import schema before medici
import { Transaction } from "./schema"

import * as accounts from "./accounts"
import * as queries from "./query"
import * as transactions from "./transaction"

import {
  UnknownLedgerError,
  LedgerError,
  LedgerServiceError,
} from "@domain/ledger/errors"
import { MainBook } from "./books"
import { toSats } from "@domain/bitcoin"
import { LedgerTransactionType, toWalletId } from "@domain/ledger"
import { lndAccountingPath, bankOwnerAccountPath } from "./accounts"

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

export const LedgerService = (): ILedgerService => {
  const getTransactionsByHash = async (
    hash: PaymentHash | TxId,
  ): Promise<LedgerTransaction[] | LedgerServiceError> => {
    try {
      const { results } = await MainBook.ledger({ hash })
      return results.map((tx) => translateToLedgerTx(tx))
    } catch (err) {
      return new UnknownLedgerError(err)
    }
  }

  const getLiabilityTransactions = async (
    liabilitiesAccountId: LiabilitiesAccountId,
  ): Promise<LedgerTransaction[] | LedgerError> => {
    try {
      const { results } = await MainBook.ledger({ account: liabilitiesAccountId })
      return results.map((tx) => translateToLedgerTx(tx))
    } catch (err) {
      return new UnknownLedgerError(err)
    }
  }

  const getLiabilityTransactionsForContactWalletName = async (
    liabilitiesAccountId: LiabilitiesAccountId,
    contactWalletName,
  ): Promise<LedgerTransaction[] | LedgerError> => {
    try {
      const { results } = await MainBook.ledger({
        account: liabilitiesAccountId,
        username: contactWalletName,
      })
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

  const getAccountBalance = async (
    liabilitiesAccountId: LiabilitiesAccountId,
  ): Promise<Satoshis | LedgerError> => {
    try {
      const { balance } = await MainBook.balance({
        account: liabilitiesAccountId,
        currency: "BTC",
      })
      return toSats(balance)
    } catch (err) {
      return new UnknownLedgerError(err)
    }
  }

  const txVolumeSince = async ({
    liabilitiesAccountId,
    timestamp,
  }: {
    liabilitiesAccountId: LiabilitiesAccountId
    timestamp: Date
  }): Promise<TxVolume | LedgerServiceError> => {
    const txnTypes = [{ type: "on_us" }, { type: "onchain_on_us" }]
    try {
      const [result]: (TxVolume & { _id: null })[] = await Transaction.aggregate([
        {
          $match: {
            accounts: liabilitiesAccountId,
            $or: txnTypes,
            $and: [{ timestamp: { $gte: timestamp } }],
          },
        },
        {
          $group: {
            _id: null,
            outgoingSats: { $sum: "$debit" },
            incomingSats: { $sum: "$credit" },
          },
        },
      ])

      return {
        outgoingSats: toSats(result?.outgoingSats ?? 0),
        incomingSats: toSats(result?.incomingSats ?? 0),
      }
    } catch (err) {
      return new UnknownLedgerError(err)
    }
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

  const isLnTxRecorded = async (
    paymentHash: PaymentHash,
  ): Promise<boolean | LedgerServiceError> => {
    try {
      const { total } = await MainBook.ledger({
        pending: false,
        hash: paymentHash,
      })
      return total > 0
    } catch (err) {
      return new UnknownLedgerError(err)
    }
  }

  const addOnChainTxReceive = async ({
    liabilitiesAccountId,
    txId,
    sats,
    fee,
    usd,
    usdFee,
    receivingAddress,
  }: ReceiveOnChainTxArgs): Promise<LedgerJournal | LedgerError> => {
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

      const savedEntry = await entry.commit()
      return translateToLedgerJournal(savedEntry)
    } catch (err) {
      return new UnknownLedgerError(err)
    }
  }

  const addLnTxReceive = async ({
    liabilitiesAccountId,
    paymentHash,
    description,
    sats,
    fee,
    usd,
    usdFee,
  }: AddLnTxReceiveArgs): Promise<LedgerJournal | LedgerError> => {
    let metadata: AddLnTxReceiveMetadata
    try {
      metadata = {
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

      const savedEntry = await entry.commit()
      return translateToLedgerJournal(savedEntry)
    } catch (err) {
      return new UnknownLedgerError(err)
    }
  }

  const addLnFeeReimbursementReceive = async ({
    liabilitiesAccountId,
    paymentHash,
    sats,
    usd,
    journalId,
  }: AddLnFeeReeimbursementReceiveArgs): Promise<LedgerJournal | LedgerError> => {
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

      const savedEntry = await entry.commit()
      return translateToLedgerJournal(savedEntry)
    } catch (err) {
      return new UnknownLedgerError(err)
    }
  }

  const addLnTxSend = async ({
    liabilitiesAccountId,
    paymentHash,
    description,
    sats,
    fee,
    usd,
    usdFee,
    pubkey,
    feeKnownInAdvance,
  }: AddLnTxSendArgs): Promise<LedgerJournal | LedgerError> => {
    let metadata: AddLnTxSendMetadata
    try {
      metadata = {
        type: LedgerTransactionType.Payment,
        pending: true,
        hash: paymentHash,
        fee,
        feeUsd: usdFee,
        sats,
        usd,
        pubkey,
        feeKnownInAdvance,
        currency: "BTC",
      }

      const entry = MainBook.entry(description)

      entry
        .credit(lndAccountingPath, sats, metadata)
        .debit(liabilitiesAccountId, sats, metadata)

      const savedEntry = await entry.commit()
      return translateToLedgerJournal(savedEntry)
    } catch (err) {
      return new UnknownLedgerError(err)
    }
  }

  const addLnIntraledgerTxSend = async ({
    liabilitiesAccountId,
    paymentHash,
    description,
    sats,
    fee,
    usd,
    usdFee,
    pubkey,
    recipientLiabilitiesAccountId,
    payerWalletName,
    recipientWalletName,
    memoPayer,
    shareMemoWithPayee,
  }: AddLnIntraledgerTxSendArgs): Promise<LedgerJournal | LedgerError> => {
    const metadata: AddLnIntraledgerTxSendMetadata = {
      type: LedgerTransactionType.IntraLedger,
      pending: false,
      hash: paymentHash,
      fee,
      feeUsd: usdFee,
      sats,
      usd,
      pubkey,
      memoPayer: null,
      username: null,
      currency: "BTC",
    }

    return addIntraledgerTxSend({
      liabilitiesAccountId,
      description,
      sats,
      recipientLiabilitiesAccountId,
      payerWalletName,
      recipientWalletName,
      memoPayer,
      shareMemoWithPayee,
      metadata,
    })
  }

  const addOnChainIntraledgerTxSend = async ({
    liabilitiesAccountId,
    description,
    sats,
    fee,
    usd,
    usdFee,
    payeeAddresses,
    sendAll,
    recipientLiabilitiesAccountId,
    payerWalletName,
    recipientWalletName,
    memoPayer,
    shareMemoWithPayee,
  }: AddOnChainIntraledgerTxSendArgs): Promise<LedgerJournal | LedgerError> => {
    const metadata: AddOnChainIntraledgerTxSendMetadata = {
      type: LedgerTransactionType.OnchainIntraLedger,
      pending: false,
      fee,
      feeUsd: usdFee,
      sats,
      usd,
      memoPayer: null,
      username: null,
      payee_addresses: payeeAddresses,
      sendAll,
      currency: "BTC",
    }

    return addIntraledgerTxSend({
      liabilitiesAccountId,
      description,
      sats,
      recipientLiabilitiesAccountId,
      payerWalletName,
      recipientWalletName,
      memoPayer,
      shareMemoWithPayee,
      metadata,
    })
  }

  const addIntraledgerTxSend = async ({
    liabilitiesAccountId,
    description,
    sats,
    recipientLiabilitiesAccountId,
    payerWalletName,
    recipientWalletName,
    memoPayer,
    shareMemoWithPayee,
    metadata,
  }: SendIntraledgerTxArgs): Promise<LedgerJournal | LedgerError> => {
    try {
      const creditMetadata = {
        ...metadata,
        username: payerWalletName,
        memoPayer: shareMemoWithPayee ? memoPayer : null,
      }
      const debitMetadata = { ...metadata, username: recipientWalletName, memoPayer }

      const entry = MainBook.entry(description)

      entry
        .credit(recipientLiabilitiesAccountId, sats, creditMetadata)
        .debit(liabilitiesAccountId, sats, debitMetadata)

      const savedEntry = await entry.commit()
      return translateToLedgerJournal(savedEntry)
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
    getTransactionsByHash,
    getLiabilityTransactions,
    getLiabilityTransactionsForContactWalletName,
    listPendingPayments,
    getPendingPaymentsCount,
    getAccountBalance,
    txVolumeSince,
    isOnChainTxRecorded,
    isLnTxRecorded,
    addOnChainTxReceive,
    addLnTxReceive,
    addLnFeeReimbursementReceive,
    addLnTxSend,
    addLnIntraledgerTxSend,
    addOnChainIntraledgerTxSend,
    settlePendingLiabilityTransactions,
    voidLedgerTransactionsForJournal,
  }
}

const translateToLedgerTx = (tx): LedgerTransaction => ({
  id: tx.id,
  walletId: toWalletId(tx.accounts),
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

const translateToLedgerJournal = (savedEntry): LedgerJournal => ({
  journalId: savedEntry._id.toString(),
  voided: savedEntry.voided,
  transactionIds: savedEntry._transactions.map((id) => id.toString()),
})
