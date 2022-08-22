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
import { fromObjectId, toObjectId } from "@services/mongoose/utils"
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
        hash,
        account: liabilitiesMainAccount,
      })
      /* eslint @typescript-eslint/ban-ts-comment: "off" */
      // @ts-ignore-next-line no-implicit-any error
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
      // @ts-ignore-next-line no-implicit-any error
      return results.map((tx) => translateToLedgerTx(tx))
    } catch (err) {
      return new UnknownLedgerError(err)
    }
  }

  const getTransactionsByWalletIds = async (
    walletIds: WalletId[],
  ): Promise<LedgerTransaction<WalletCurrency>[] | LedgerError> => {
    const liabilitiesWalletIds = walletIds.map(toLiabilitiesWalletId)
    try {
      const { results } = await MainBook.ledger({
        account: liabilitiesWalletIds,
      })
      // @ts-ignore-next-line no-implicit-any error
      return results.map((tx) => translateToLedgerTx(tx))
    } catch (err) {
      return new UnknownLedgerError(err)
    }
  }

  const getTransactionsByWalletIdAndContactUsername = async (
    walletId: WalletId,
    // @ts-ignore-next-line no-implicit-any error
    contactUsername,
  ): Promise<LedgerTransaction<WalletCurrency>[] | LedgerError> => {
    const liabilitiesWalletId = toLiabilitiesWalletId(walletId)
    try {
      const { results } = await MainBook.ledger({
        account: liabilitiesWalletId,
        username: contactUsername,
      })
      // @ts-ignore-next-line no-implicit-any error
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

      // @ts-ignore-next-line no-implicit-any error
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
      ...intraledger,
      ...volume,
      ...send,
      ...receive,
    },
  })
}

export const translateToLedgerTx = (
  tx: ILedgerTransaction,
): LedgerTransaction<WalletCurrency> => ({
  id: fromObjectId<LedgerTransactionId>(tx._id || ""),
  walletId: toWalletId(tx.accounts as LiabilitiesWalletId),
  type: tx.type,
  debit: toSats(tx.debit),
  credit: toSats(tx.credit),
  fee: toSats(tx.fee || 0),
  usd: tx.usd || 0,
  feeUsd: tx.feeUsd || 0,
  currency: tx.currency,
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
})

// @ts-ignore-next-line no-implicit-any error
export const translateToLedgerJournal = (savedEntry): LedgerJournal => ({
  journalId: savedEntry._id.toString(),
  voided: savedEntry.voided,
  // @ts-ignore-next-line no-implicit-any error
  transactionIds: savedEntry._transactions.map((id) => id.toString()),
})
