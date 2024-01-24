/**
 * an accounting reminder:
 * https://en.wikipedia.org/wiki/Double-entry_bookkeeping
 */
import { Types } from "mongoose"
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
  WalletCurrency,
} from "@domain/shared"
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

// FLASH FORK: import ibex dependencies
import Ibex from "@services/ibex"
import { IbexApiError, IbexAuthenticationError, IbexEventError } from "@services/ibex/errors"

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

  // const transactionTypeMapping: Record<number, LedgerTransactionType> = {
  //   1: "invoice",
  //   2: "payment",
  //   3: "onchain_receipt",
  //   4: "onchain_payment",
  // }

  // function convertToILedgerTransaction(
  //   // eslint-disable-next-line @typescript-eslint/no-explicit-any
  //   apiData: any,
  // ): ILedgerTransaction[] {
  //   // eslint-disable-next-line @typescript-eslint/no-explicit-any
  //   return apiData.data.map((transaction: any) => ({
  //     _id: new Types.ObjectId(),
  //     credit: [1, 3].includes(transaction.transactionTypeId) ? transaction.amount : 0,
  //     debit: [2, 4].includes(transaction.transactionTypeId) ? transaction.amount : 0,
  //     datetime: new Date(transaction.createdAt),
  //     account_path: [], // No corresponding data in the given API response.
  //     accounts: transaction.accountId,
  //     book: "", // No corresponding data in the given API response.
  //     memo: "", // No corresponding data in the given API response.
  //     _journal: new Types.ObjectId(),
  //     timestamp: new Date(transaction.settledAt),
  //     type: transactionTypeMapping[transaction.transactionTypeId] || "fee",
  //     pending: false, // Assuming transactions are not pending; modify as needed.
  //     currency: transaction.currencyId === 3 ? "USD" : "BTC", // Assuming 3 represents BTC; modify as needed.
  //     satsAmount: transaction.amount * transaction.exchangeRateCurrencySats, // Example; adjust if incorrect.
  //     centsAmount: transaction.amount * 100, // Convert to cents; adjust if needed.
  //     satsFee: transaction.networkFee * transaction.exchangeRateCurrencySats, // Example; adjust if incorrect.
  //     centsFee: transaction.networkFee * 100, // Convert to cents; adjust if needed.
  //     displayAmount: transaction.amount,
  //     displayFee: transaction.networkFee,
  //     displayCurrency: "USD", // Assuming USD; replace as needed.
  //     fee: transaction.networkFee,
  //     usd: transaction.amount, // Assuming amount is in USD; adjust if needed.
  //     feeUsd: transaction.networkFee, // Assuming networkFee is in USD; adjust if needed.
  //     paymentHash: [1, 3].includes(transaction.transactionTypeId) ? "" : "",
  //     // Fill in other fields as required or based on your data.
  //   }))
  // }

  const getTransactionsByWalletIds = async ({
    walletIds,
    paginationArgs = {} as PaginationArgs,
  }: {
    walletIds: WalletId[]
    paginationArgs: PaginationArgs
  }): Promise<PaginatedArray<LedgerTransaction<WalletCurrency>> | LedgerError> => {
    const liabilitiesWalletIds = walletIds.map(toLiabilitiesWalletId)
    try {
      // FLASH FORK: replace USD walletId transactions with IBex walletId transactions
      const ledgerResp = await paginatedLedger({
        query: { account: liabilitiesWalletIds },
        paginationArgs,
      })
      // const endPoint = `${IbexRoutes.Transactions}${walletIds[1]}`
      // const GetTransactions = await requestIBexPlugin("GET", endPoint, {}, {})
      // if (GetTransactions && GetTransactions.data && GetTransactions.data["data"]) {
      //   const ibexConvertedTransactions = convertToILedgerTransaction(
      //     GetTransactions.data,
      //   )
      //   console.log(
      //     "ibexConvertedTransactions",
      //     JSON.stringify(ibexConvertedTransactions, null, 2),
      //   )
      if (ledgerResp instanceof Error) {
        return ledgerResp
      }

      // ledgerResp.slice = ibexConvertedTransactions
      // ledgerResp.total = ibexConvertedTransactions.length

      // Overwrite ledgerResp's slice with ibexConvertedTransactions
      const { slice, total } = ledgerResp

      return {
        slice: slice.map((tx) => translateToLedgerTx(tx)),
        total,
      }
      // }
    } catch (err) {
      return new UnknownLedgerError(err)
    }
    // return new LedgerError("Failed to fetch transactions.")
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
        slice: slice.map((tx) => translateToLedgerTx(tx)),
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
  ): Promise<Satoshis | LedgerError | IbexEventError> => {
    const liabilitiesWalletId = toLiabilitiesWalletId(walletId)
    try {
      let { balance } = await MainBook.balance({
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

      const resp = await Ibex.getAccountDetails({ accountId: walletId })
      if (resp instanceof IbexApiError ) {
        console.error(`Ibex Call failed with ${resp.code}: ${resp.message}`)
        if (resp.code === 403) return toSats(0) // this is a hack for requests to Ibex with accountIds it doesn't recognize
        return resp
      }
      if (resp instanceof IbexAuthenticationError) {
        console.error("Failed to get wallet balance.")
        return resp
      }
      if (resp.balance === undefined) return new IbexEventError("Balance not found")
    
      return toSats(resp.balance * 100)
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

  const getWalletIdByTransactionHash = async (
    hash: PaymentHash | OnChainTxHash,
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
      isOnChainReceiptTxRecordedForWallet,
      isOnChainTxHashRecorded,
      isLnTxRecorded,
      getWalletIdByTransactionHash,
      listWalletIdsWithPendingPayments,
      ...admin,
      ...volume,
      ...send,
    },
  })
}

export const translateToLedgerTx = <S extends WalletCurrency, T extends DisplayCurrency>(
  tx: ILedgerTransaction,
): LedgerTransaction<S> => {
  const currency = tx.currency as S

  const displayCurrency =
    tx.displayCurrency !== undefined ? (tx.displayCurrency as T) : undefined

  const debit = currency === WalletCurrency.Btc ? toSats(tx.debit) : toCents(tx.debit)
  const credit = currency === WalletCurrency.Btc ? toSats(tx.credit) : toCents(tx.credit)

  return {
    id: fromObjectId<LedgerTransactionId>(tx._id || ""),
    walletId: toWalletId(tx.accounts as LiabilitiesWalletId),
    type: tx.type,
    debit,
    credit,
    currency,
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
    requestId: (tx.request_id as OnChainAddressRequestId) || undefined,
    payoutId: (tx.payout_id as PayoutId) || undefined,
    txHash: (tx.hash as OnChainTxHash) || undefined,
    vout: (tx.vout as OnChainTxVout) || undefined,
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
    displayCurrency,

    fee: tx.fee,
    usd: tx.usd,
    feeUsd: tx.feeUsd,
  }
}
