/**
 * an accounting reminder:
 * https://en.wikipedia.org/wiki/Double-entry_bookkeeping
 */

import { toSats } from "@domain/bitcoin"
import {
  LedgerTransactionType,
  liabilitiesMainAccount,
  toLiabilitiesWalletId,
  toWalletId,
} from "@domain/ledger"
import { BalanceLessThanZeroError } from "@domain/errors"
import {
  CouldNotFindTransactionError,
  LedgerError,
  LedgerServiceError,
  UnknownLedgerError,
} from "@domain/ledger/errors"
import { ErrorLevel } from "@domain/shared"
import { toObjectId } from "@services/mongoose/utils"
import {
  recordExceptionInCurrentSpan,
  wrapAsyncFunctionsToRunInSpan,
} from "@services/tracing"

import { admin } from "./admin"
import * as adminLegacy from "./admin-legacy"
import { MainBook, Transaction } from "./books"
import * as caching from "./caching"
import { TransactionsMetadataRepository } from "./services"
import { intraledger } from "./intraledger"
import { receive } from "./receive"
import { send } from "./send"
import { volume } from "./volume"

export const lazyLoadLedgerAdmin = ({
  bankOwnerWalletResolver,
  dealerBtcWalletResolver,
  dealerUsdWalletResolver,
  funderWalletResolver,
}: LoadLedgerParams) => {
  caching.setBankOwnerWalletResolver(bankOwnerWalletResolver)
  caching.setDealerBtcWalletResolver(dealerBtcWalletResolver)
  caching.setDealerUsdWalletResolver(dealerUsdWalletResolver)
  caching.setFunderWalletResolver(funderWalletResolver)
  return {
    ...adminLegacy,
  }
}

export const LedgerService = (): ILedgerService => {
  const updateMetadataByHash = async (
    ledgerTxMetadata:
      | OnChainLedgerTransactionMetadataUpdate
      | LnLedgerTransactionMetadataUpdate,
  ): Promise<true | LedgerServiceError | RepositoryError> =>
    TransactionsMetadataRepository().updateByHash(ledgerTxMetadata)

  const getTransactionById = async (
    id: LedgerTransactionId,
  ): Promise<LedgerTransaction<WalletCurrency> | LedgerServiceError> => {
    try {
      const _id = toObjectId<LedgerTransactionId>(id)
      const { results } = await MainBook.ledger({
        account_path: liabilitiesMainAccount,
        _id,
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
  ): Promise<LedgerTransaction<WalletCurrency>[] | LedgerServiceError> => {
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

  const getTransactionsByWalletId = async (
    walletId: WalletId,
  ): Promise<LedgerTransaction<WalletCurrency>[] | LedgerError> => {
    const liabilitiesWalletId = toLiabilitiesWalletId(walletId)
    try {
      const { results } = await MainBook.ledger({ account: liabilitiesWalletId })
      return results.map((tx) => translateToLedgerTx(tx))
    } catch (err) {
      return new UnknownLedgerError(err)
    }
  }

  const getTransactionsByWalletIdAndContactUsername = async (
    walletId: WalletId,
    contactUsername,
  ): Promise<LedgerTransaction<WalletCurrency>[] | LedgerError> => {
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
  ): Promise<LedgerTransaction<WalletCurrency>[] | LedgerError> => {
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

  async function* listAllPaymentHashes(): AsyncGenerator<PaymentHash | LedgerError> {
    const aggregationParams = [
      {
        $match: {
          type: LedgerTransactionType.Payment,
        },
      },
      {
        $group: {
          _id: "$hash",
          createdAt: { $first: "$timestamp" },
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
    ]

    try {
      const agg = Transaction.aggregate(aggregationParams)
        .cursor({ batchSize: 100 })
        .exec()
      for await (const { _id } of agg) {
        yield _id
      }
    } catch (err) {
      yield new UnknownLedgerError(err)
    }
  }

  const getPendingPaymentsCount = async (
    walletId: WalletId,
  ): Promise<number | LedgerError> => {
    const liabilitiesWalletId = toLiabilitiesWalletId(walletId)
    return Transaction.countDocuments({
      accounts: liabilitiesWalletId,
      type: LedgerTransactionType.Payment,
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
      })
      if (balance < 0) {
        recordExceptionInCurrentSpan({
          error: new BalanceLessThanZeroError(balance),
          attributes: {
            "getWalletBalance.error.invalidBalance": `${balance}`,
          },
          level: ErrorLevel.Critical,
        })
      }
      return toSats(balance)
    } catch (err) {
      return new UnknownLedgerError(err)
    }
  }

  const getWalletBalanceAmount = async <S extends WalletCurrency>({
    walletId,
    walletCurrency,
  }: {
    walletId: WalletId
    walletCurrency: S
  }): Promise<PaymentAmount<S> | LedgerError> => {
    const liabilitiesWalletId = toLiabilitiesWalletId(walletId)
    try {
      const { balance } = await MainBook.balance({
        account: liabilitiesWalletId,
      })
      return { amount: BigInt(balance), currency: walletCurrency }
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

  const getWalletIdByTransactionHash = async (
    hash: OnChainTxHash,
  ): Promise<WalletId | LedgerServiceError> => {
    const bankOwnerWalletId = await caching.getBankOwnerWalletId()
    const bankOwnerPath = toLiabilitiesWalletId(bankOwnerWalletId)
    const entry = await Transaction.findOne({
      account_path: liabilitiesMainAccount,
      accounts: { $ne: bankOwnerPath },
      hash,
    })
    if (!entry) {
      return new CouldNotFindTransactionError()
    }
    const walletId = toWalletId(entry.accounts as LiabilitiesWalletId)
    if (!walletId) {
      return new UnknownLedgerError("no wallet id associated to transaction")
    }
    return walletId
  }

  const listWalletIdsWithPendingPayments = async function* ():
    | AsyncGenerator<WalletId>
    | LedgerServiceError {
    let transactions
    try {
      transactions = Transaction.aggregate([
        {
          $match: {
            type: "payment",
            pending: true,
            account_path: liabilitiesMainAccount,
          },
        },
        { $group: { _id: "$accounts" } },
      ])
        .cursor({ batchSize: 100 })
        .exec()
    } catch (error) {
      return new UnknownLedgerError(error)
    }

    for await (const { _id } of transactions) {
      yield toWalletId(_id)
    }
  }

  return wrapAsyncFunctionsToRunInSpan({
    namespace: "services.ledger",
    fns: {
      updateMetadataByHash,
      getTransactionById,
      getTransactionsByHash,
      getTransactionsByWalletId,
      getTransactionsByWalletIdAndContactUsername,
      listPendingPayments,
      listAllPaymentHashes,
      getPendingPaymentsCount,
      getWalletBalance,
      getWalletBalanceAmount,
      isOnChainTxRecorded,
      isLnTxRecorded,
      getWalletIdByTransactionHash,
      listWalletIdsWithPendingPayments,
      ...admin,
      ...intraledger,
      ...volume,
      ...send,
      ...receive,
    },
  })
}

export const translateToLedgerTx = (tx): LedgerTransaction<WalletCurrency> => ({
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

export const translateToLedgerJournal = (savedEntry): LedgerJournal => ({
  journalId: savedEntry._id.toString(),
  voided: savedEntry.voided,
  transactionIds: savedEntry._transactions.map((id) => id.toString()),
})
