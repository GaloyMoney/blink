// an accounting reminder:
// https://en.wikipedia.org/wiki/Double-entry_bookkeeping

// assets:
export const assetsMainAccount = "Assets"
export const lndLedgerAccountId =
  `${assetsMainAccount}:Reserve:Lightning` as LedgerAccountId // TODO: rename to Assets:Lnd
