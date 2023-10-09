import { MainBook } from "./books"
import { getBankOwnerWalletId } from "./caching"
import {
  assetsMainAccount,
  coldStorageAccountId,
  escrowAccountId,
  lndLedgerAccountId,
  onChainLedgerAccountId,
} from "./domain/accounts"

import { WalletCurrency } from "@/domain/shared"
import {
  LedgerTransactionType,
  liabilitiesMainAccount,
  toLiabilitiesWalletId,
  UnknownLedgerError,
} from "@/domain/ledger"

const getWalletBalance = async (account: string, query = {}) => {
  const params = { account, currency: "BTC", ...query }
  const { balance } = await MainBook.balance(params)
  return balance
}

export const getAssetsBalance = (currency = "BTC") =>
  getWalletBalance(assetsMainAccount, { currency })

export const getLiabilitiesBalance = (currency = "BTC") =>
  getWalletBalance(liabilitiesMainAccount, { currency })

export const getLndBalance = () => getWalletBalance(lndLedgerAccountId)

export const getLndEscrowBalance = () => getWalletBalance(escrowAccountId)

export const getBitcoindBalance = () => getWalletBalance(coldStorageAccountId)

export const getOnChainBalance = () => getWalletBalance(onChainLedgerAccountId)

export const getBankOwnerBalance = async (currency = "BTC") => {
  const bankOwnerPath = toLiabilitiesWalletId(await getBankOwnerWalletId())
  return getWalletBalance(bankOwnerPath, { currency })
}

export const updateLndEscrow = async (amount: Satoshis) => {
  const ledgerEscrow = await getLndEscrowBalance()

  // ledgerEscrow is negative
  // diff will equal 0 if there is no change
  const diff = amount + ledgerEscrow

  const escrowData = { ledgerPrevAmount: ledgerEscrow, lndAmount: amount, diff }

  if (diff === 0) {
    return { ...escrowData, updated: false }
  }

  const entry = MainBook.entry("escrow")
  const metadata = {
    type: LedgerTransactionType.Escrow,
    currency: WalletCurrency.Btc,
    pending: false,
  }

  if (diff > 0) {
    entry
      .credit(lndLedgerAccountId, diff, metadata)
      .debit(escrowAccountId, diff, metadata)
  } else if (diff < 0) {
    entry
      .debit(lndLedgerAccountId, -diff, metadata)
      .credit(escrowAccountId, -diff, metadata)
  }

  await entry.commit()

  return { ...escrowData, updated: true }
}

export const addLndChannelOpeningOrClosingFee = async ({
  description,
  fee,
  metadata,
}: {
  description: string
  fee: Satoshis
  metadata: { txid: string }
}) => {
  const txMetadata = {
    currency: WalletCurrency.Btc,
    type: LedgerTransactionType.Fee, // FIXME: be more precise than just "Fee"
    pending: false,
    ...metadata,
  }

  const bankOwnerPath = toLiabilitiesWalletId(await getBankOwnerWalletId())

  try {
    await MainBook.entry(description)
      .debit(bankOwnerPath, fee, txMetadata)
      .credit(lndLedgerAccountId, fee, txMetadata)
      .commit()

    return true
  } catch (err) {
    return new UnknownLedgerError(err)
  }
}

export const addLndRoutingRevenue = async ({
  amount,
  collectedOn,
}: {
  amount: Satoshis
  collectedOn: string // FIXME should be Date?
}) => {
  const metadata = {
    type: LedgerTransactionType.RoutingRevenue,
    currency: WalletCurrency.Btc,
    feesCollectedOn: collectedOn,
    pending: false,
  }

  const bankOwnerPath = toLiabilitiesWalletId(await getBankOwnerWalletId())

  try {
    await MainBook.entry("routing fee")
      .credit(bankOwnerPath, amount, metadata)
      .debit(lndLedgerAccountId, amount, metadata)
      .commit()

    return true
  } catch (err) {
    return new UnknownLedgerError(err)
  }
}
