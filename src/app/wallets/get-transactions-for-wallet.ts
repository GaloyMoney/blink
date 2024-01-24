import { memoSharingConfig } from "@config"
import { PartialResult } from "@app/partial-result"

import { LedgerError } from "@domain/ledger"
import { WalletTransactionHistory } from "@domain/wallets"
import { CouldNotFindError } from "@domain/errors"

import { getNonEndUserWalletIds, LedgerService } from "@services/ledger"
import { WalletOnChainPendingReceiveRepository } from "@services/mongoose"
import Ibex from "@services/ibex"
import { IbexApiError, IbexEventError } from "@services/ibex/errors"
import { GResponse200 } from "@services/ibex/.api/apis/sing-in/types"

export const getTransactionsForWallets = async ({
  wallets,
  paginationArgs,
}: {
  wallets: Wallet[]
  paginationArgs?: PaginationArgs
}): Promise<PartialResult<PaginatedArray<WalletTransaction>>> => {
  const walletIds = wallets.map((wallet) => wallet.id)

  // Flash fork: return history from Ibex

  // let pendingHistory = await WalletOnChainPendingReceiveRepository().listByWalletIds({
  //   walletIds,
  // })
  // if (pendingHistory instanceof Error) {
  //   if (pendingHistory instanceof CouldNotFindError) {
  //     pendingHistory = []
  //   } else {
  //     return PartialResult.err(pendingHistory)
  //   }
  // }


  /* Get transactions for wallet Ids then map to ConfirmedTransactionsHistory (below) */
  // const confirmedLedgerTxns = await LedgerService().getTransactionsByWalletIds({
  //   walletIds,
  //   paginationArgs,
  // })

  // if (confirmedLedgerTxns instanceof LedgerError) {
  //   return PartialResult.partial(
  //     { slice: pendingHistory, total: pendingHistory.length },
  //     confirmedLedgerTxns,
  //   )
  // }

  // ConfirmedTransactionsHistory => WalletTransaction[] 
  // type WalletTransaction =
  // | IntraLedgerTransaction
  // | WalletOnChainTransaction
  // | WalletLnTransaction
  // const confirmedHistory = WalletTransactionHistory.fromLedger({
  //   ledgerTransactions: confirmedLedgerTxns.slice,
  //   nonEndUserWalletIds: Object.values(await getNonEndUserWalletIds()),
  //   memoSharingConfig,
  // })

  
    // })
    
  const ibexCalls = await Promise.all(walletIds
    .map(id => Ibex.getAccountTransactions({ 
      account_id: id,
    }))
  )
  
  const transactions = ibexCalls.flatMap(resp => {
    if (resp instanceof IbexEventError) return [] 
    else return toWalletTransactions(resp)
  })

  return PartialResult.ok({
    slice: transactions,
    total: transactions.length
    // total: confirmedLedgerTxns.total + pendingHistory.length,
  })
}


const toWalletTransactions = (ibexResp: GResponse200): WalletTransaction[] => {
  return ibexResp.map(trx => {
    const currency = (trx.currencyId === 3 ? "USD" : "BTC") as WalletCurrency // WalletCurrency: "USD" | "BTC",

    const settlementDisplayPrice: WalletMinorUnitDisplayPrice<WalletCurrency, DisplayCurrency> = {
      base: trx.exchangeRateCurrencySats ? BigInt(Math.floor(trx.exchangeRateCurrencySats)) : 0n,
      offset: 0n, // what is this?
      displayCurrency: "USD" as DisplayCurrency,
      walletCurrency: currency
    }
    return {
      walletId: (trx.accountId || "") as WalletId, // WalletId | undefined
      settlementAmount: trx.currencyId === 3 ? trx.amount as UsdCents : trx.amount as Satoshis,
      settlementFee: trx.currencyId === 3 ? trx.networkFee as UsdCents : trx.networkFee as Satoshis,
      settlementCurrency: currency, // WalletCurrency: "USD" | "BTC",
      settlementDisplayAmount: `${trx.amount}`, // what should this be?
      settlementDisplayFee: `${trx.networkFee}`, // what should this be?
      settlementDisplayPrice: settlementDisplayPrice,
      createdAt: trx.createdAt ? new Date(trx.createdAt) : new Date(), // should always return
      id: trx.id || "null", // "LedgerTransactionId", // this can probably be removed
      status: "success" as TxStatus, // assuming Ibex returns on completed
      memo: null, // not provided by Ibex
      initiationVia: { type: "lightning", paymentHash: "", pubkey: "" },
      settlementVia: { type: "lightning", revealedPreImage: undefined }
    } as WalletLnSettledTransaction
  })
}
