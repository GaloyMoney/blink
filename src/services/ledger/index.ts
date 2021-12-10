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
  CouldNotFindTransactionError,
  UnknownLedgerError,
  LedgerError,
  LedgerServiceError,
} from "@domain/ledger/errors"
import { MainBook } from "./books"
import { toSats } from "@domain/bitcoin"
import { LedgerTransactionType, liabilitiesMainAccount, toWalletId } from "@domain/ledger"
import { lndAccountingPath, bankOwnerAccountPath } from "./accounts"

type LoadLedgerParams = {
  bankOwnerWalletResolver: () => Promise<string>
  dealerWalletResolver: () => Promise<string>
}

export const loadLedger = ({
  bankOwnerWalletResolver,
  dealerWalletResolver,
}: LoadLedgerParams) => {
  accounts.setbankOwnerWalletResolver(bankOwnerWalletResolver)
  accounts.setdealerWalletResolver(dealerWalletResolver)
  return {
    ...accounts,
    ...queries,
    ...transactions,
  }
}

export const LedgerService = (): ILedgerService => {
  const getTransactionById = async (
    id: LedgerTransactionId,
  ): Promise<LedgerTransaction | LedgerServiceError> => {
    try {
      const { results } = await MainBook.ledger({
        account_path: liabilitiesMainAccount,
        _id: id,
      })
      if (results.length === 1) {
        return translateToLedgerTx(results[0])
      }
      return new CouldNotFindTransactionError()
    } catch (err) {
      return new UnknownLedgerError(err)
    }
  }

  const getTransactionsByHash = async (
    hash: PaymentHash | OnChainTxHash,
  ): Promise<LedgerTransaction[] | LedgerServiceError> => {
    try {
      const { results } = await MainBook.ledger({
        account_path: liabilitiesMainAccount,
        hash,
      })
      return results.map((tx) => translateToLedgerTx(tx))
    } catch (err) {
      return new UnknownLedgerError(err)
    }
  }

  const getLiabilityTransactions = async (
    liabilitiesWalletId: LiabilitiesWalletId,
  ): Promise<LedgerTransaction[] | LedgerError> => {
    try {
      const { results } = await MainBook.ledger({ account: liabilitiesWalletId })
      return results.map((tx) => translateToLedgerTx(tx))
    } catch (err) {
      return new UnknownLedgerError(err)
    }
  }

  const getLiabilityTransactionsForContactUsername = async (
    liabilitiesWalletId: LiabilitiesWalletId,
    contactUsername,
  ): Promise<LedgerTransaction[] | LedgerError> => {
    try {
      const { results } = await MainBook.ledger({
        account: liabilitiesWalletId,
        username: contactUsername,
      })
      return results.map((tx) => translateToLedgerTx(tx))
    } catch (err) {
      return new UnknownLedgerError(err)
    }
  }

  const listPendingPayments = async (
    liabilitiesWalletId: LiabilitiesWalletId,
  ): Promise<LedgerTransaction[] | LedgerError> => {
    try {
      const { results } = await MainBook.ledger({
        account: liabilitiesWalletId,
        type: LedgerTransactionType.Payment,
        pending: true,
      })
      return results.map((tx) => translateToLedgerTx(tx))
    } catch (err) {
      return new UnknownLedgerError(err)
    }
  }

  const getPendingPaymentsCount = async (
    liabilitiesWalletId: LiabilitiesWalletId,
  ): Promise<number | LedgerError> => {
    return Transaction.countDocuments({
      accounts: liabilitiesWalletId,
      type: "payment",
      pending: true,
    })
  }

  const getAccountBalance = async (
    liabilitiesWalletId: LiabilitiesWalletId,
  ): Promise<Satoshis | LedgerError> => {
    try {
      const { balance } = await MainBook.balance({
        account: liabilitiesWalletId,
        currency: "BTC",
      })
      return toSats(balance)
    } catch (err) {
      return new UnknownLedgerError(err)
    }
  }

  const twoFATxVolumeSince = async ({
    liabilitiesWalletId,
    timestamp,
  }: {
    liabilitiesWalletId: LiabilitiesWalletId
    timestamp: Date
  }) =>
    txVolumeSince({
      liabilitiesWalletId,
      timestamp,
      txnTypes: [
        LedgerTransactionType.IntraLedger,
        LedgerTransactionType.OnchainIntraLedger,
        LedgerTransactionType.Payment,
        LedgerTransactionType.OnchainPayment,
      ],
    })

  const withdrawalTxVolumeSince = async ({
    liabilitiesWalletId,
    timestamp,
  }: {
    liabilitiesWalletId: LiabilitiesWalletId
    timestamp: Date
  }) =>
    txVolumeSince({
      liabilitiesWalletId,
      timestamp,
      txnTypes: [LedgerTransactionType.Payment, LedgerTransactionType.OnchainPayment],
    })

  const intraledgerTxVolumeSince = async ({
    liabilitiesWalletId,
    timestamp,
  }: {
    liabilitiesWalletId: LiabilitiesWalletId
    timestamp: Date
  }) =>
    txVolumeSince({
      liabilitiesWalletId,
      timestamp,
      txnTypes: [
        LedgerTransactionType.IntraLedger,
        LedgerTransactionType.OnchainIntraLedger,
      ],
    })

  const txVolumeSince = async ({
    liabilitiesWalletId,
    timestamp,
    txnTypes,
  }: {
    liabilitiesWalletId: LiabilitiesWalletId
    timestamp: Date
    txnTypes: LedgerTransactionType[]
  }): Promise<TxVolume | LedgerServiceError> => {
    const txnTypesObj = txnTypes.map((txnType) => ({
      type: txnType,
    }))

    try {
      const [result]: (TxVolume & { _id: null })[] = await Transaction.aggregate([
        {
          $match: {
            accounts: liabilitiesWalletId,
            $or: txnTypesObj,
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
    liabilitiesWalletId: LiabilitiesWalletId,
    txHash: OnChainTxHash,
  ): Promise<boolean | LedgerServiceError> => {
    try {
      const result = await Transaction.countDocuments({
        accounts: liabilitiesWalletId,
        type: LedgerTransactionType.OnchainReceipt,
        hash: txHash,
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
    liabilitiesWalletId,
    txHash,
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
        hash: txHash,
        fee,
        usdFee,
        sats,
        usd,
        payee_addresses: [receivingAddress],
      }

      const entry = MainBook.entry("")
        .credit(liabilitiesWalletId, sats - fee, metadata)
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
    liabilitiesWalletId,
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
        .credit(liabilitiesWalletId, sats - fee, metadata)
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
    liabilitiesWalletId,
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
        .credit(liabilitiesWalletId, sats, metadata)
        .debit(lndAccountingPath, sats, metadata)

      const savedEntry = await entry.commit()
      return translateToLedgerJournal(savedEntry)
    } catch (err) {
      return new UnknownLedgerError(err)
    }
  }

  const addLnTxSend = async ({
    liabilitiesWalletId,
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
        .debit(liabilitiesWalletId, sats, metadata)

      const savedEntry = await entry.commit()
      return translateToLedgerJournal(savedEntry)
    } catch (err) {
      return new UnknownLedgerError(err)
    }
  }

  const addLnIntraledgerTxSend = async ({
    liabilitiesWalletId,
    paymentHash,
    description,
    sats,
    fee,
    usd,
    usdFee,
    pubkey,
    recipientLiabilitiesWalletId,
    payerUsername,
    recipientUsername,
    memoPayer,
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
      liabilitiesWalletId,
      description,
      sats,
      recipientLiabilitiesWalletId,
      payerUsername,
      recipientUsername,
      memoPayer,
      shareMemoWithPayee: false,
      metadata,
    })
  }

  const addOnChainIntraledgerTxSend = async ({
    liabilitiesWalletId,
    description,
    sats,
    fee,
    usd,
    usdFee,
    payeeAddresses,
    sendAll,
    recipientLiabilitiesWalletId,
    payerUsername,
    recipientUsername,
    memoPayer,
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
      liabilitiesWalletId,
      description,
      sats,
      recipientLiabilitiesWalletId,
      payerUsername,
      recipientUsername,
      memoPayer,
      shareMemoWithPayee: false,
      metadata,
    })
  }

  const addUsernameIntraledgerTxSend = async ({
    liabilitiesWalletId,
    description,
    sats,
    fee,
    usd,
    usdFee,
    recipientLiabilitiesWalletId,
    payerUsername,
    recipientUsername,
    memoPayer,
  }: AddUsernameIntraledgerTxSendArgs): Promise<LedgerJournal | LedgerError> => {
    const metadata: AddUsernameIntraledgerTxSendMetadata = {
      type: LedgerTransactionType.IntraLedger,
      pending: false,
      fee,
      feeUsd: usdFee,
      sats,
      usd,
      memoPayer: null,
      username: null,
      currency: "BTC",
    }

    return addIntraledgerTxSend({
      liabilitiesWalletId,
      description,
      sats,
      recipientLiabilitiesWalletId,
      payerUsername,
      recipientUsername,
      memoPayer,
      shareMemoWithPayee: true,
      metadata,
    })
  }

  const addIntraledgerTxSend = async ({
    liabilitiesWalletId,
    description,
    sats,
    recipientLiabilitiesWalletId,
    payerUsername,
    recipientUsername,
    memoPayer,
    shareMemoWithPayee,
    metadata,
  }: SendIntraledgerTxArgs): Promise<LedgerJournal | LedgerError> => {
    try {
      const creditMetadata = {
        ...metadata,
        username: payerUsername,
        memoPayer: shareMemoWithPayee ? memoPayer : null,
      }
      const debitMetadata = { ...metadata, username: recipientUsername, memoPayer }

      const entry = MainBook.entry(description)

      entry
        .credit(recipientLiabilitiesWalletId, sats, creditMetadata)
        .debit(liabilitiesWalletId, sats, debitMetadata)

      const savedEntry = await entry.commit()
      return translateToLedgerJournal(savedEntry)
    } catch (err) {
      return new UnknownLedgerError(err)
    }
  }

  const settlePendingLnPayments = async (
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
    getTransactionById,
    getTransactionsByHash,
    getLiabilityTransactions,
    getLiabilityTransactionsForContactUsername,
    listPendingPayments,
    getPendingPaymentsCount,
    getAccountBalance,
    twoFATxVolumeSince,
    withdrawalTxVolumeSince,
    intraledgerTxVolumeSince,
    isOnChainTxRecorded,
    isLnTxRecorded,
    addOnChainTxReceive,
    addLnTxReceive,
    addLnFeeReimbursementReceive,
    addLnTxSend,
    addLnIntraledgerTxSend,
    addOnChainIntraledgerTxSend,
    addUsernameIntraledgerTxSend,
    settlePendingLnPayments,
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
  username: tx.username,
  memoFromPayer: tx.memoPayer,
  paymentHash: tx.hash,
  pubkey: tx.pubkey,
  address:
    tx.payee_addresses && tx.payee_addresses.length > 0
      ? tx.payee_addresses[0]
      : undefined,
  txHash: tx.hash,
  feeKnownInAdvance: tx.feeKnownInAdvance || false,
})

const translateToLedgerJournal = (savedEntry): LedgerJournal => ({
  journalId: savedEntry._id.toString(),
  voided: savedEntry.voided,
  transactionIds: savedEntry._transactions.map((id) => id.toString()),
})
