/**
 * an accounting reminder:
 * https://en.wikipedia.org/wiki/Double-entry_bookkeeping
 */

// we have to import schema before medici
// eslint-disable-next-line
import { Transaction } from "./schema"

import {
  CouldNotFindTransactionError,
  UnknownLedgerError,
  LedgerError,
  LedgerServiceError,
} from "@domain/ledger/errors"

import { toSats } from "@domain/bitcoin"

import {
  LedgerTransactionType,
  liabilitiesMainAccount,
  toLiabilitiesWalletId,
  toWalletId,
} from "@domain/ledger"

import { wrapAsyncToRunInSpan } from "@services/tracing"

import * as accounts from "./accounts"
import * as queries from "./query"
import * as transactions from "./transaction"

import { MainBook } from "./books"

import { lndAccountingPath, getBankOwnerWalletId } from "./accounts"

export const loadLedger = ({
  bankOwnerWalletResolver,
  dealerWalletResolver,
  funderWalletResolver,
}: LoadLedgerParams) => {
  accounts.setBankOwnerWalletResolver(bankOwnerWalletResolver)
  accounts.setDealerWalletResolver(dealerWalletResolver)
  accounts.setFunderWalletResolver(funderWalletResolver)
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
    walletId: WalletId,
  ): Promise<LedgerTransaction[] | LedgerError> => {
    const liabilitiesWalletId = toLiabilitiesWalletId(walletId)
    try {
      const { results } = await MainBook.ledger({ account: liabilitiesWalletId })
      return results.map((tx) => translateToLedgerTx(tx))
    } catch (err) {
      return new UnknownLedgerError(err)
    }
  }

  const getLiabilityTransactionsForContactUsername = async (
    walletId: WalletId,
    contactUsername,
  ): Promise<LedgerTransaction[] | LedgerError> => {
    const liabilitiesWalletId = toLiabilitiesWalletId(walletId)
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
    walletId: WalletId,
  ): Promise<LedgerTransaction[] | LedgerError> => {
    const liabilitiesWalletId = toLiabilitiesWalletId(walletId)
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
    walletId: WalletId,
  ): Promise<number | LedgerError> => {
    const liabilitiesWalletId = toLiabilitiesWalletId(walletId)
    return Transaction.countDocuments({
      accounts: liabilitiesWalletId,
      type: "payment",
      pending: true,
    })
  }

  const getWalletBalance = async (
    walletId: WalletId,
  ): Promise<Satoshis | LedgerError> => {
    const liabilitiesWalletId = toLiabilitiesWalletId(walletId)
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

  const allPaymentVolumeSince = async ({
    walletId,
    timestamp,
  }: {
    walletId: WalletId
    timestamp: Date
  }) => {
    return txVolumeSince({
      walletId,
      timestamp,
      txnTypes: [
        LedgerTransactionType.IntraLedger,
        LedgerTransactionType.OnchainIntraLedger,
        LedgerTransactionType.Payment,
        LedgerTransactionType.OnchainPayment,
      ],
    })
  }

  const externalPaymentVolumeSince = async ({
    walletId,
    timestamp,
  }: {
    walletId: WalletId
    timestamp: Date
  }) => {
    return txVolumeSince({
      walletId,
      timestamp,
      txnTypes: [LedgerTransactionType.Payment, LedgerTransactionType.OnchainPayment],
    })
  }

  const intraledgerTxVolumeSince = async ({
    walletId,
    timestamp,
  }: {
    walletId: WalletId
    timestamp: Date
  }) => {
    return txVolumeSince({
      walletId,
      timestamp,
      txnTypes: [
        LedgerTransactionType.IntraLedger,
        LedgerTransactionType.OnchainIntraLedger,
      ],
    })
  }

  const allTxVolumeSince = async ({
    walletId,
    timestamp,
  }: {
    walletId: WalletId
    timestamp: Date
  }) => {
    return txVolumeSince({
      walletId,
      timestamp,
      txnTypes: Object.values(LedgerTransactionType),
    })
  }

  const txVolumeSince = async ({
    walletId,
    timestamp,
    txnTypes,
  }: {
    walletId: WalletId
    timestamp: Date
    txnTypes: LedgerTransactionType[]
  }): Promise<TxVolume | LedgerServiceError> => {
    const liabilitiesWalletId = toLiabilitiesWalletId(walletId)

    const txnTypesObj = txnTypes.map((txnType) => ({
      type: txnType,
    }))

    try {
      const [result]: (TxVolume & { _id: null })[] = await wrapAsyncToRunInSpan({
        namespace: `service.ledger`,
        fn: async () =>
          Transaction.aggregate([
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
          ]),
      })()

      return {
        outgoingSats: toSats(result?.outgoingSats ?? 0),
        incomingSats: toSats(result?.incomingSats ?? 0),
      }
    } catch (err) {
      return new UnknownLedgerError(err)
    }
  }

  const isOnChainTxRecorded = async ({
    walletId,
    txHash,
  }: {
    walletId: WalletId
    txHash: OnChainTxHash
  }): Promise<boolean | LedgerServiceError> => {
    const liabilitiesWalletId = toLiabilitiesWalletId(walletId)

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
    walletId,
    txHash,
    sats,
    fee,
    usd,
    usdFee,
    receivingAddress,
  }: ReceiveOnChainTxArgs): Promise<LedgerJournal | LedgerError> => {
    const liabilitiesWalletId = toLiabilitiesWalletId(walletId)

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
        const bankOwnerPath = toLiabilitiesWalletId(await getBankOwnerWalletId())
        entry.credit(bankOwnerPath, fee, metadata)
      }

      const savedEntry = await entry.commit()
      return translateToLedgerJournal(savedEntry)
    } catch (err) {
      return new UnknownLedgerError(err)
    }
  }

  const addLnTxReceive = async ({
    walletId,
    paymentHash,
    description,
    sats,
    fee,
    usd,
    usdFee,
  }: AddLnTxReceiveArgs): Promise<LedgerJournal | LedgerError> => {
    const liabilitiesWalletId = toLiabilitiesWalletId(walletId)

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
        const bankOwnerPath = toLiabilitiesWalletId(await getBankOwnerWalletId())
        entry.credit(bankOwnerPath, fee, metadata)
      }

      const savedEntry = await entry.commit()
      return translateToLedgerJournal(savedEntry)
    } catch (err) {
      return new UnknownLedgerError(err)
    }
  }

  const addLnFeeReimbursementReceive = async ({
    walletId,
    paymentHash,
    sats,
    usd,
    journalId,
  }: AddLnFeeReeimbursementReceiveArgs): Promise<LedgerJournal | LedgerError> => {
    const liabilitiesWalletId = toLiabilitiesWalletId(walletId)

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
    walletId,
    paymentHash,
    description,
    sats,
    fee,
    usd,
    usdFee,
    pubkey,
    feeKnownInAdvance,
  }: AddLnTxSendArgs): Promise<LedgerJournal | LedgerError> => {
    const liabilitiesWalletId = toLiabilitiesWalletId(walletId)

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
    senderWalletId,
    paymentHash,
    description,
    sats,
    fee,
    usd,
    usdFee,
    pubkey,
    recipientWalletId,
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
      senderWalletId,
      description,
      sats,
      recipientWalletId,
      payerUsername,
      recipientUsername,
      memoPayer,
      shareMemoWithPayee: false,
      metadata,
    })
  }

  const addOnChainIntraledgerTxSend = async ({
    senderWalletId,
    description,
    sats,
    fee,
    usd,
    usdFee,
    payeeAddresses,
    sendAll,
    recipientWalletId,
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
      senderWalletId,
      description,
      sats,
      recipientWalletId,
      payerUsername,
      recipientUsername,
      memoPayer,
      shareMemoWithPayee: false,
      metadata,
    })
  }

  const addWalletIdIntraledgerTxSend = async ({
    senderWalletId,
    description,
    sats,
    fee,
    usd,
    usdFee,
    recipientWalletId,
    payerUsername,
    recipientUsername,
    memoPayer,
  }: addWalletIdIntraledgerTxSendArgs): Promise<LedgerJournal | LedgerError> => {
    const metadata: addWalletIdIntraledgerTxSendMetadata = {
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
      senderWalletId,
      description,
      sats,
      recipientWalletId,
      payerUsername,
      recipientUsername,
      memoPayer,
      shareMemoWithPayee: true,
      metadata,
    })
  }

  const addIntraledgerTxSend = async ({
    senderWalletId,
    description,
    sats,
    recipientWalletId,
    payerUsername,
    recipientUsername,
    memoPayer,
    shareMemoWithPayee,
    metadata,
  }: SendIntraledgerTxArgs): Promise<LedgerJournal | LedgerError> => {
    const senderLiabilitiesWalletId = toLiabilitiesWalletId(senderWalletId)
    const recipientLiabilitiesWalletId = toLiabilitiesWalletId(recipientWalletId)

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
        .debit(senderLiabilitiesWalletId, sats, debitMetadata)

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

  const getWalletIdByTransactionHash = async (
    hash,
  ): Promise<WalletId | LedgerServiceError> => {
    const bankOwnerWalletId = await getBankOwnerWalletId()
    const bankOwnerPath = toLiabilitiesWalletId(bankOwnerWalletId)
    const entry = await Transaction.findOne({
      account_path: liabilitiesMainAccount,
      accounts: { $ne: bankOwnerPath },
      hash,
    })
    if (!entry) {
      return new CouldNotFindTransactionError()
    }
    const walletId = accounts.resolveWalletId(entry.account_path)
    if (!walletId) {
      return new UnknownLedgerError("no wallet id associated to transaction")
    }
    return walletId
  }

  return {
    getTransactionById,
    getTransactionsByHash,
    getLiabilityTransactions,
    getLiabilityTransactionsForContactUsername,
    listPendingPayments,
    getPendingPaymentsCount,
    getWalletBalance,
    allPaymentVolumeSince,
    externalPaymentVolumeSince,
    intraledgerTxVolumeSince,
    allTxVolumeSince,
    isOnChainTxRecorded,
    isLnTxRecorded,
    addOnChainTxReceive,
    addLnTxReceive,
    addLnFeeReimbursementReceive,
    addLnTxSend,
    addLnIntraledgerTxSend,
    addOnChainIntraledgerTxSend,
    addWalletIdIntraledgerTxSend,
    settlePendingLnPayments,
    voidLedgerTransactionsForJournal,
    getWalletIdByTransactionHash,
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
