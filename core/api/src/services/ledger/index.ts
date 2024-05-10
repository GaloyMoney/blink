/**
 * an accounting reminder:
 * https://en.wikipedia.org/wiki/Double-entry_bookkeeping
 */

import { admin } from "./admin"

import * as adminLegacy from "./admin-legacy"

import { MainBook, Transaction } from "./books"

import { paginatedLedger } from "./paginated-ledger"

import * as caching from "./caching"

import { TransactionsMetadataRepository } from "./services"

import { send } from "./send"

import { translateToLedgerTx, translateToLedgerTxWithMetadata } from "./translate"

import { toSats } from "@/domain/bitcoin"
import {
  LedgerTransactionType,
  liabilitiesMainAccount,
  toLiabilitiesWalletId,
  toWalletId,
} from "@/domain/ledger"
import { BalanceLessThanZeroError } from "@/domain/errors"
import {
  CouldNotFindTransactionError,
  LedgerError,
  LedgerServiceError,
  UnknownLedgerError,
} from "@/domain/ledger/errors"
import {
  balanceAmountFromNumber,
  BigIntFloatConversionError,
  ErrorLevel,
} from "@/domain/shared"
import { fromObjectId, toObjectId } from "@/services/mongoose/utils"
import {
  recordExceptionInCurrentSpan,
  wrapAsyncFunctionsToRunInSpan,
} from "@/services/tracing"

export { getNonEndUserWalletIds } from "./caching"
export { translateToLedgerJournal } from "./helpers"

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
        account: liabilitiesMainAccount,
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

  const getTransactionForWalletById = async ({
    walletId,
    transactionId,
  }: {
    walletId: WalletId
    transactionId: LedgerTransactionId
  }): Promise<LedgerTransaction<WalletCurrency> | LedgerServiceError> => {
    const liabilitiesWalletId = toLiabilitiesWalletId(walletId)
    try {
      const _id = toObjectId<LedgerTransactionId>(transactionId)
      const { results } = await MainBook.ledger({
        account: liabilitiesWalletId,
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

  const getTransactionForWalletByJournalId = async ({
    walletId,
    journalId,
  }: {
    walletId: WalletId
    journalId: LedgerJournalId
  }): Promise<LedgerTransaction<WalletCurrency> | LedgerServiceError> => {
    try {
      const liabilitiesWalletId = toLiabilitiesWalletId(walletId)
      const { results } = await MainBook.ledger({
        account: liabilitiesWalletId,
        _journal: toObjectId(journalId),
      })
      if (results.length !== 1) {
        return new CouldNotFindTransactionError()
      }
      const rawTx = results[0]
      const ledgerTxId = fromObjectId<LedgerTransactionId>(rawTx._id || "")

      let txMetadata: LedgerTransactionMetadata | undefined = undefined
      const txMetadataResult = await TransactionsMetadataRepository().findById(ledgerTxId)
      if (txMetadataResult instanceof Error) {
        recordExceptionInCurrentSpan({ error: txMetadataResult })
      } else {
        txMetadata = txMetadataResult
      }

      return translateToLedgerTxWithMetadata({ rawTx, txMetadata })
    } catch (err) {
      return new UnknownLedgerError(err)
    }
  }

  const getTransactionsByHash = async (
    hash: PaymentHash | OnChainTxHash,
  ): Promise<LedgerTransaction<WalletCurrency>[] | LedgerServiceError> => {
    try {
      const { results } = await MainBook.ledger({
        hash,
        account: liabilitiesMainAccount,
      })
      return results.map((tx) => translateToLedgerTx(tx))
    } catch (err) {
      return new UnknownLedgerError(err)
    }
  }

  const getTransactionsForWalletByPaymentHash = async ({
    walletId,
    paymentHash,
  }: {
    walletId: WalletId
    paymentHash: PaymentHash
  }): Promise<LedgerTransaction<WalletCurrency>[] | LedgerError> => {
    const liabilitiesWalletId = toLiabilitiesWalletId(walletId)
    try {
      const { results } = await MainBook.ledger({
        account: liabilitiesWalletId,
        hash: paymentHash,
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
      const { results } = await MainBook.ledger({
        account: liabilitiesWalletId,
      })
      return results.map((tx) => translateToLedgerTx(tx))
    } catch (err) {
      return new UnknownLedgerError(err)
    }
  }

  const getTransactionsByWalletIds = async ({
    walletIds,
    paginationArgs,
  }: {
    walletIds: WalletId[]
    paginationArgs: PaginatedQueryArgs
  }): Promise<PaginatedQueryResult<LedgerTransaction<WalletCurrency>> | LedgerError> => {
    const liabilitiesWalletIds = walletIds.map(toLiabilitiesWalletId)
    try {
      const ledgerResp = await paginatedLedger({
        filters: {
          mediciFilters: { account: liabilitiesWalletIds },
        },
        paginationArgs,
      })

      return ledgerResp
    } catch (err) {
      return new UnknownLedgerError(err)
    }
  }

  const getTransactionsByWalletIdsAndAddresses = async ({
    walletIds,
    paginationArgs,
    addresses,
  }: {
    walletIds: WalletId[]
    paginationArgs: PaginatedQueryArgs
    addresses: OnChainAddress[]
  }): Promise<PaginatedQueryResult<LedgerTransaction<WalletCurrency>> | LedgerError> => {
    const liabilitiesWalletIds = walletIds.map(toLiabilitiesWalletId)
    try {
      const ledgerResp = await paginatedLedger({
        filters: { mediciFilters: { account: liabilitiesWalletIds }, addresses },
        paginationArgs,
      })

      return ledgerResp
    } catch (err) {
      return new UnknownLedgerError(err)
    }
  }

  const getTransactionsByWalletIdAndContactUsername = async ({
    walletIds,
    contactUsername,
    paginationArgs,
  }: {
    walletIds: WalletId[]
    contactUsername: Username
    paginationArgs: PaginatedQueryArgs
  }): Promise<PaginatedQueryResult<LedgerTransaction<WalletCurrency>> | LedgerError> => {
    const liabilitiesWalletIds = walletIds.map(toLiabilitiesWalletId)
    try {
      const ledgerResp = await paginatedLedger({
        filters: {
          mediciFilters: { account: liabilitiesWalletIds },
          username: contactUsername,
        },
        paginationArgs,
      })

      return ledgerResp
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
    try {
      const agg = Transaction.aggregate()
        .match({ type: LedgerTransactionType.Payment })
        .group({
          _id: "$hash",
          createdAt: { $first: "$timestamp" },
        })
        .sort({ createdAt: -1 })
        .cursor({ batchSize: 100 })
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
      const { balance } = await MainBook.balance(
        {
          account: liabilitiesWalletId,
        },
        { readPreference: "primaryPreferred" },
      )
      if (balance < 0) {
        const dealerUsdWalletId = await caching.getDealerUsdWalletId()
        const dealerBtcWalletId = await caching.getDealerBtcWalletId()

        if (walletId !== dealerUsdWalletId && walletId !== dealerBtcWalletId) {
          recordExceptionInCurrentSpan({
            error: new BalanceLessThanZeroError(balance.toString()),
            attributes: {
              "getWalletBalance.error.invalidBalance": `${balance}`,
            },
            level: ErrorLevel.Critical,
          })
        }
      }
      return toSats(balance)
    } catch (err) {
      return new UnknownLedgerError(err)
    }
  }

  const getWalletBalanceAmount = async <S extends WalletCurrency>(
    walletDescriptor: WalletDescriptor<S>,
  ): Promise<BalanceAmount<S> | LedgerError> => {
    const liabilitiesWalletId = toLiabilitiesWalletId(walletDescriptor.id)
    try {
      const { balance } = await MainBook.balance(
        {
          account: liabilitiesWalletId,
        },
        { readPreference: "primaryPreferred" },
      )
      if (balance < 0) {
        const dealerWalletIds = Object.values(await caching.getDealerWalletIds())

        if (!dealerWalletIds.includes(walletDescriptor.id)) {
          recordExceptionInCurrentSpan({
            error: new BalanceLessThanZeroError(balance.toString()),
            attributes: {
              "getWalletBalance.error.invalidBalance": `${balance}`,
            },
            level: ErrorLevel.Critical,
          })
        }
      }

      const balanceAmount = balanceAmountFromNumber({
        amount: balance,
        currency: walletDescriptor.currency,
      })
      // FIXME: correct database entries in staging/prod to remove this check
      if (balanceAmount instanceof BigIntFloatConversionError) {
        recordExceptionInCurrentSpan({
          error: balanceAmount,
          level: ErrorLevel.Critical,
          attributes: {
            ["error.message"]: `Inconsistent float balance from db: ${balance}`,
          },
        })
        return balanceAmountFromNumber({
          amount: Math.floor(balance),
          currency: walletDescriptor.currency,
        })
      }

      return balanceAmount
    } catch (err) {
      return new UnknownLedgerError(err)
    }
  }

  const isOnChainReceiptTxRecordedForWallet = async ({
    walletId,
    txHash,
    vout,
  }: {
    walletId: WalletId
    txHash: OnChainTxHash
    vout: OnChainTxVout
  }): Promise<IsOnChainReceiptTxRecordedForWalletResult | LedgerServiceError> => {
    const liabilitiesWalletId = toLiabilitiesWalletId(walletId)

    try {
      const entry = await Transaction.findOne({
        accounts: liabilitiesWalletId,
        type: LedgerTransactionType.OnchainReceipt,
        hash: txHash,
        $or: [{ vout: { $exists: false } }, { vout }],
      })

      if (!entry) {
        return { recorded: false, newAddressRequestId: undefined }
      }

      const tx = translateToLedgerTx(entry)
      return { recorded: true, newAddressRequestId: tx.requestId }
    } catch (err) {
      return new UnknownLedgerError(err)
    }
  }

  const isOnChainTxHashRecorded = async (
    txHash: OnChainTxHash,
  ): Promise<boolean | LedgerServiceError> => {
    try {
      const result = await Transaction.countDocuments({
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
      const { total: totalNotPending } = await MainBook.ledger({
        pending: false,
        hash: paymentHash,
      })
      const { total: totalPending } = await MainBook.ledger({
        pending: true,
        hash: paymentHash,
      })

      return totalNotPending > 0 && totalPending === 0
    } catch (err) {
      return new UnknownLedgerError(err)
    }
  }

  const getWalletIdByPaymentHash = async (
    hash: PaymentHash,
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
      ]).cursor({ batchSize: 100 })
    } catch (error) {
      return new UnknownLedgerError(error)
    }

    for await (const { _id } of transactions) {
      const result = toWalletId(_id)
      if (result) {
        yield result
      }
    }
  }

  return wrapAsyncFunctionsToRunInSpan({
    namespace: "services.ledger",
    fns: {
      updateMetadataByHash,
      getTransactionById,
      getTransactionForWalletById,
      getTransactionForWalletByJournalId,
      getTransactionsByHash,
      getTransactionsForWalletByPaymentHash,
      getTransactionsByWalletId,
      getTransactionsByWalletIds,
      getTransactionsByWalletIdsAndAddresses,
      getTransactionsByWalletIdAndContactUsername,
      listPendingPayments,
      listAllPaymentHashes,
      getPendingPaymentsCount,
      getWalletBalance,
      getWalletBalanceAmount,
      isOnChainReceiptTxRecordedForWallet,
      isOnChainTxHashRecorded,
      isLnTxRecorded,
      getWalletIdByPaymentHash,
      listWalletIdsWithPendingPayments,
      ...admin,
      ...send,
    },
  })
}
