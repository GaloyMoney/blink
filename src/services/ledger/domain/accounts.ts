// an accounting reminder:
// https://en.wikipedia.org/wiki/Double-entry_bookkeeping

import { WalletCurrency } from "@domain/shared"

// assets:
export const assetsMainAccount = "Assets"
export const lndLedgerAccountId =
  `${assetsMainAccount}:Reserve:Lightning` as LedgerAccountId // TODO: rename to Assets:Lnd

export const coldStorageAccountId = `${assetsMainAccount}:Reserve:Bitcoind`

export const lndLedgerAccountDescriptor = {
  id: lndLedgerAccountId,
  currency: WalletCurrency.Btc,
} as LedgerAccountDescriptor<"BTC">

export const coldStorageAccountDescriptor = {
  id: coldStorageAccountId,
  currency: WalletCurrency.Btc,
} as LedgerAccountDescriptor<"BTC">
