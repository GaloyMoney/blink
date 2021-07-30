/**
 * an accounting reminder:
 * https://en.wikipedia.org/wiki/Double-entry_bookkeeping
 */

import * as accounts from "./accounts"
import * as queries from "./query"
import * as transactions from "./transaction"

export function loadLedger() {
  return {
    ...accounts,
    ...queries,
    ...transactions,
  }
}
