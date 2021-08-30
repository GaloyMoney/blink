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

import { UnknownLedgerError, LedgerError } from "@domain/ledger/errors"
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
      return results.map((tx) => {
        return {
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
          lnMemo: tx.memo,
          walletName: tx.username,
          memoFromPayer: tx.memoPayer,
          paymentHash: tx.hash,
          addresses: tx.payee_addresses,
          txId: tx.hash,
        }
      })
    } catch (err) {
      return new UnknownLedgerError(err)
    }
  }

  const isOnChainTxRecorded = async (
    liabilitiesAccountId: LiabilitiesAccountId,
    txId: TxId,
  ): Promise<boolean | LedgerServiceError> => {
    try {
      const result = Transaction.countDocuments({
        accounts: liabilitiesAccountId,
        type: LedgerTransactionType.OnchainReceipt,
        hash: txId,
      })
      return result
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

  return { getLiabilityTransactions, isOnChainTxRecorded, receiveOnChainTx, receiveLnTx }
}
