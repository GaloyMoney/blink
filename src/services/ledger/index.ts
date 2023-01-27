/**
 * an accounting reminder:
 * https://en.wikipedia.org/wiki/Double-entry_bookkeeping
 */

import { toSats } from "@domain/bitcoin"
import { toCents } from "@domain/fiat"
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
import {
  balanceAmountFromNumber,
  BigIntFloatConversionError,
  ErrorLevel,
} from "@domain/shared"
import { baseLogger } from "@services/logger"
import { fromObjectId, toObjectId } from "@services/mongoose/utils"
import {
  recordExceptionInCurrentSpan,
  wrapAsyncFunctionsToRunInSpan,
} from "@services/tracing"

import { admin } from "./admin"
import * as adminLegacy from "./admin-legacy"
import { MainBook, Transaction } from "./books"
import { paginatedLedger } from "./paginated-ledger"
import * as caching from "./caching"
import { TransactionsMetadataRepository } from "./services"
import { send } from "./send"
import { volume } from "./volume"

export { getNonEndUserWalletIds } from "./caching"

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
        return translateToLedgerTxWithMetadataFetch(results[0])
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
        hash,
        account: liabilitiesMainAccount,
      })
      return translateToLedgerTxsWithMetadataFetch(results)
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
      return translateToLedgerTxsWithMetadataFetch(results)
    } catch (err) {
      return new UnknownLedgerError(err)
    }
  }

  const getTransactionsByWalletIds = async ({
    walletIds,
    paginationArgs = {} as PaginationArgs,
  }: {
    walletIds: WalletId[]
    paginationArgs: PaginationArgs
  }): Promise<PaginatedArray<LedgerTransaction<WalletCurrency>> | LedgerError> => {
    const liabilitiesWalletIds = walletIds.map(toLiabilitiesWalletId)
    try {
      const ledgerResp = await paginatedLedger({
        query: { account: liabilitiesWalletIds },
        paginationArgs,
      })

      if (ledgerResp instanceof Error) {
        return ledgerResp
      }

      const { slice, total } = ledgerResp

      return {
        slice: await Promise.all(
          slice.map((tx) => translateToLedgerTxWithMetadataFetch(tx)),
        ),
        total,
      }
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
    paginationArgs?: PaginationArgs
  }): Promise<PaginatedArray<LedgerTransaction<WalletCurrency>> | LedgerError> => {
    const liabilitiesWalletIds = walletIds.map(toLiabilitiesWalletId)
    try {
      const ledgerResp = await paginatedLedger({
        query: { account: liabilitiesWalletIds, username: contactUsername },
        paginationArgs,
      })

      if (ledgerResp instanceof Error) {
        return ledgerResp
      }

      const { slice, total } = ledgerResp

      return {
        slice: await Promise.all(
          slice.map((tx) => translateToLedgerTxWithMetadataFetch(tx)),
        ),
        total,
      }
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

      return Promise.all(results.map((tx) => translateToLedgerTxWithMetadataFetch(tx)))
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
      const { balance } = await MainBook.balance({
        account: liabilitiesWalletId,
      })
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
      const { balance } = await MainBook.balance({
        account: liabilitiesWalletId,
      })
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
      ]).cursor({ batchSize: 100 })
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
      getTransactionsByWalletIds,
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
      ...volume,
      ...send,
    },
  })
}

const translateToLedgerTx = <S extends WalletCurrency>(
  tx: ILedgerTransaction,
): LedgerTransaction<S> => ({
  id: fromObjectId<LedgerTransactionId>(tx._id || ""),
  walletId: toWalletId(tx.accounts as LiabilitiesWalletId),
  type: tx.type,
  debit: tx.debit as S extends "BTC" ? Satoshis : UsdCents,
  credit: tx.credit as S extends "BTC" ? Satoshis : UsdCents,
  currency: tx.currency as S,
  timestamp: tx.timestamp,
  pendingConfirmation: tx.pending,
  journalId: tx._journal.toString() as LedgerJournalId,
  lnMemo: tx.memo,
  username: (tx.username as Username) || undefined,
  memoFromPayer: tx.memoPayer,
  paymentHash: (tx.hash as PaymentHash) || undefined,
  pubkey: (tx.pubkey as Pubkey) || undefined,
  address:
    tx.payee_addresses && tx.payee_addresses.length > 0
      ? (tx.payee_addresses[0] as OnChainAddress)
      : undefined,
  txHash: (tx.hash as OnChainTxHash) || undefined,
  feeKnownInAdvance: tx.feeKnownInAdvance || false,

  satsAmount: tx.satsAmount !== undefined ? toSats(tx.satsAmount) : undefined,
  centsAmount: tx.centsAmount !== undefined ? toCents(tx.centsAmount) : undefined,
  satsFee: tx.satsFee !== undefined ? toSats(tx.satsFee) : undefined,
  centsFee: tx.centsFee !== undefined ? toCents(tx.centsFee) : undefined,
  displayAmount:
    tx.displayAmount !== undefined
      ? (tx.displayAmount as DisplayCurrencyBaseAmount)
      : undefined,
  displayFee:
    tx.displayFee !== undefined
      ? (tx.displayFee as DisplayCurrencyBaseAmount)
      : undefined,
  displayCurrency:
    tx.displayCurrency !== undefined
      ? (tx.displayCurrency as DisplayCurrency)
      : undefined,

  fee: tx.fee,
  usd: tx.usd,
  feeUsd: tx.feeUsd,
})

export const translateToLedgerTxWithMetadataFetch = async <S extends WalletCurrency>(
  tx: ILedgerTransaction,
): Promise<LedgerTransaction<S>> => {
  const txMetadata = await TransactionsMetadataRepository().findById(
    fromObjectId<LedgerTransactionId>(tx._id || ""),
  )

  if (txMetadata instanceof Error) {
    if (!(txMetadata instanceof CouldNotFindTransactionError)) {
      baseLogger.error(
        { error: txMetadata },
        `could not fetch transaction metadata for id '${tx._id}'`,
      )
      recordExceptionInCurrentSpan({ error: txMetadata, level: ErrorLevel.Critical })
    }

    return {
      ...translateToLedgerTx<S>(tx),

      revealedPreImage: undefined,
    }
  }

  return {
    ...translateToLedgerTx<S>(tx),

    revealedPreImage:
      "revealedPreImage" in txMetadata ? txMetadata.revealedPreImage : undefined,
  }
}

export const translateToLedgerTxsWithMetadataFetch = async <S extends WalletCurrency>(
  txs: Array<ILedgerTransaction>,
): Promise<Array<LedgerTransaction<S>>> => {
  const txsMetadata = await TransactionsMetadataRepository().listByIds(
    txs.map((tx) => fromObjectId<LedgerTransactionId>(tx._id || "")),
  )

  if (txsMetadata instanceof Error) {
    if (!(txsMetadata instanceof CouldNotFindTransactionError)) {
      baseLogger.error({ error: txsMetadata }, `could not fetch transactions metadata`)
      recordExceptionInCurrentSpan({ error: txsMetadata, level: ErrorLevel.Critical })
    }

    return txs.map((tx) => translateToLedgerTx<S>(tx))
  }

  return txs.map((tx) => ({
    ...translateToLedgerTx<S>(tx),
    revealedPreImage: txsMetadata.find(
      (txm) => txm.id === fromObjectId<LedgerTransactionId>(tx._id || ""),
    ),
  }))
}

export const translateToLedgerJournal = (savedEntry): LedgerJournal => ({
  journalId: savedEntry._id.toString(),
  voided: savedEntry.voided,
  transactionIds: savedEntry._transactions.map((id) => id.toString()),
})
