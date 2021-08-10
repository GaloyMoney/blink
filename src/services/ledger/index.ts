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
