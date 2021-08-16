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
import { toSats } from "@domain/bitcoin"

export const MakeLedgerService = (): ILedgerService => {
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
          username: tx.username,
          memoFromPayer: tx.memoPayer,
          paymentHash: tx.hash,
          addresses: tx.payee_addresses,
        }
      })
    } catch (err) {
      return new UnknownLedgerError(err)
    }
  }

  return { getLiabilityTransactions }
}
