import { toLiabilitiesWalletId } from "@domain/ledger"

import { escrowAccountingPath, getBankOwnerWalletId, lndAccountingPath } from "./accounts"
import { MainBook } from "./books"
import { getLndEscrowBalance } from "./query"

export const addLndChannelFee = async ({ description, amount, metadata }) => {
  const txMetadata = {
    currency: "BTC",
    type: "fee",
    pending: false,
    ...metadata,
  }

  const bankOwnerPath = toLiabilitiesWalletId(await getBankOwnerWalletId())

  return MainBook.entry(description)
    .debit(bankOwnerPath, amount, txMetadata)
    .credit(lndAccountingPath, amount, txMetadata)
    .commit()
}

export const addLndRoutingFee = async ({ amount, collectedOn }) => {
  const metadata = {
    type: "routing_fee",
    currency: "BTC",
    feesCollectedOn: collectedOn,
    pending: false,
  }

  const bankOwnerPath = toLiabilitiesWalletId(await getBankOwnerWalletId())

  return MainBook.entry("routing fee")
    .credit(bankOwnerPath, amount, metadata)
    .debit(lndAccountingPath, amount, metadata)
    .commit()
}

export const updateLndEscrow = async ({ amount }) => {
  const ledgerEscrow = await getLndEscrowBalance()

  // ledgerEscrow is negative
  // diff will equal 0 if there is no change
  const diff = amount + ledgerEscrow

  const escrowData = { ledgerPrevAmount: ledgerEscrow, lndAmount: amount, diff }

  if (diff === 0) {
    return { ...escrowData, updated: false }
  }

  const entry = MainBook.entry("escrow")
  const metadata = { type: "escrow", currency: "BTC", pending: false }

  if (diff > 0) {
    entry
      .credit(lndAccountingPath, diff, metadata)
      .debit(escrowAccountingPath, diff, metadata)
  } else if (diff < 0) {
    entry
      .debit(lndAccountingPath, -diff, metadata)
      .credit(escrowAccountingPath, -diff, metadata)
  }

  await entry.commit()

  return { ...escrowData, updated: true }
}
