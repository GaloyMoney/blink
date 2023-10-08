// an accounting reminder:
// https://en.wikipedia.org/wiki/Double-entry_bookkeeping

import { WalletCurrency } from "@/domain/shared"

// assets:
export const assetsMainAccount = "Assets"
export const lndLedgerAccountUuid =
  `${assetsMainAccount}:Reserve:Lightning` as LedgerAccountUuid // TODO: rename to Assets:Lnd
export const onChainLedgerAccountUuid =
  `${assetsMainAccount}:OnChain` as LedgerAccountUuid

export const coldStorageAccountUuid = `${assetsMainAccount}:Reserve:Bitcoind`
export const escrowAccountUuid = `${assetsMainAccount}:Reserve:Escrow` // TODO: rename to Assets:Lnd:Escrow

export const lndLedgerAccountDescriptor = {
  id: lndLedgerAccountUuid,
  currency: WalletCurrency.Btc,
} as LedgerAccountDescriptor<"BTC">

export const onChainLedgerAccountDescriptor = {
  id: onChainLedgerAccountUuid,
  currency: WalletCurrency.Btc,
} as LedgerAccountDescriptor<"BTC">

export const coldStorageAccountDescriptor = {
  id: coldStorageAccountUuid,
  currency: WalletCurrency.Btc,
} as LedgerAccountDescriptor<"BTC">
