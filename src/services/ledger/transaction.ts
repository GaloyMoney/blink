import {
  dealerAccountPath,
  accountPath,
  lndAccountingPath,
  bankOwnerAccountPath,
  escrowAccountingPath,
  bitcoindAccountingPath,
} from "./accounts"
import { MainBook } from "./books"
import { Transaction } from "./schema"
import { getLndEscrowBalance } from "./query"

export const addLndReceipt = async ({
  description,
  payeeUser,
  metadata,
  sats,
  lastPrice,
}) => {
  const dealerPath = await dealerAccountPath()

  const entry = MainBook.entry(description)

  if (payeeUser.ratioBtc) {
    entry.credit(payeeUser.accountPath, sats * payeeUser.ratioBtc, {
      ...metadata,
      currency: "BTC",
    })
  }

  entry
    // always 100%
    .debit(lndAccountingPath, sats, { ...metadata, currency: "BTC" })

  if (payeeUser.ratioUsd) {
    // other leg for the BTC. this is how the dealer get the BTC send to the user
    entry.credit(dealerPath, sats * payeeUser.ratioUsd, { ...metadata, currency: "BTC" })

    const satsToConvert = sats * payeeUser.ratioUsd

    // TODO: add spread
    const usdEquivalent = satsToConvert * lastPrice

    entry
      .credit(payeeUser.accountPath, usdEquivalent, { ...metadata, currency: "USD" })
      .debit(dealerPath, usdEquivalent, { ...metadata, currency: "USD" })
  }

  // TODO: log the exchange rate

  await entry.commit()
}

export const addLndPayment = async ({
  description,
  sats,
  metadata,
  payerUser,
  lastPrice,
}) => {
  const dealerPath = await dealerAccountPath()

  const entry = MainBook.entry(description)

  entry
    // always 100%
    .credit(lndAccountingPath, sats, { ...metadata, currency: "BTC" })

  if (payerUser.ratioBtc) {
    entry.debit(payerUser.accountPath, sats * payerUser.ratioBtc, {
      ...metadata,
      currency: "BTC",
    })
  }

  if (payerUser.ratioUsd) {
    entry.debit(dealerPath, sats * payerUser.ratioUsd, { ...metadata, currency: "BTC" })

    const satsToConvert = sats * payerUser.ratioUsd
    const usdEquivalent = satsToConvert * lastPrice

    entry
      .credit(dealerPath, usdEquivalent, { ...metadata, currency: "USD" })
      .debit(payerUser.accountPath, usdEquivalent, { ...metadata, currency: "USD" })
  }

  await entry.commit()

  return entry
}

export const addLndChannelFee = async ({ description, amount, metadata }) => {
  const txMetadata = {
    currency: "BTC",
    type: "fee",
    pending: false,
    ...metadata,
  }

  const bankOwnerPath = await bankOwnerAccountPath()

  return await MainBook.entry(description)
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

  const bankOwnerPath = await bankOwnerAccountPath()

  return await MainBook.entry("routing fee")
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

export const addOnchainReceipt = async ({
  description,
  sats,
  fee,
  account,
  metadata,
}) => {
  const txMetadata = {
    currency: "BTC",
    type: "onchain_receipt",
    pending: false,
    ...metadata,
  }

  const entry = MainBook.entry(description)
    .credit(account, sats - fee, txMetadata)
    .debit(lndAccountingPath, sats, txMetadata)

  if (fee) {
    const bankOwnerPath = await bankOwnerAccountPath()
    // no need to have an entry if there is no fee.
    entry.credit(bankOwnerPath, fee, txMetadata)
  }

  await entry.commit()

  return entry
}

export const addOnchainPayment = async ({
  description,
  sats,
  fee,
  account,
  metadata,
}) => {
  const txMetadata = {
    currency: "BTC",
    type: "onchain_payment",
    pending: true,
    ...metadata,
  }

  const bankOwnerPath = await bankOwnerAccountPath()

  // TODO/FIXME refactor. add the transaction first and set the fees in a second tx.
  return await MainBook.entry(description)
    .credit(lndAccountingPath, sats - fee, txMetadata)
    .credit(bankOwnerPath, fee, txMetadata)
    .debit(account, sats, txMetadata)
    .commit()
}

export const addOnUsPayment = async ({
  description,
  sats,
  metadata,
  payerUser,
  payeeUser,
  memoPayer,
  shareMemoWithPayee,
  lastPrice,
}: IAddTransactionOnUsPayment) => {
  const dealerPath = await dealerAccountPath()

  const entry = MainBook.entry(description)

  entry
    .credit(accountPath(payeeUser._id), sats * payeeUser.ratioBtc, {
      ...metadata,
      memoPayer: shareMemoWithPayee ? memoPayer : null,
      username: payerUser.username,
      currency: "BTC",
    })
    .debit(payerUser.accountPath, sats * payerUser.ratioBtc, {
      ...metadata,
      memoPayer: memoPayer,
      username: payeeUser.username,
      currency: "BTC",
    })

  if (payeeUser.ratioBtc > payerUser.ratioBtc) {
    entry.debit(dealerPath, sats * (payeeUser.ratioBtc - payerUser.ratioBtc), {
      ...metadata,
      currency: "BTC",
    })
  } else if (payeeUser.ratioBtc < payerUser.ratioBtc) {
    entry.credit(dealerPath, sats * (payerUser.ratioBtc - payeeUser.ratioBtc), {
      ...metadata,
      currency: "BTC",
    })
  }

  if (!!payerUser.ratioUsd || !!payeeUser.ratioUsd) {
    const usdEq = sats * lastPrice

    entry
      .credit(accountPath(payeeUser._id), usdEq * payeeUser.ratioUsd, {
        ...metadata,
        memoPayer: shareMemoWithPayee ? memoPayer : null,
        username: payerUser.username,
        currency: "USD",
      })
      .debit(payerUser.accountPath, usdEq * payerUser.ratioUsd, {
        ...metadata,
        memoPayer: memoPayer,
        username: payeeUser.username,
        currency: "USD",
      })

    if (payeeUser.ratioUsd > payerUser.ratioUsd) {
      entry.debit(dealerPath, usdEq * (payeeUser.ratioUsd - payerUser.ratioUsd), {
        ...metadata,
        currency: "USD",
      })
    } else if (payeeUser.ratioUsd < payerUser.ratioUsd) {
      entry.credit(dealerPath, usdEq * (payerUser.ratioUsd - payeeUser.ratioUsd), {
        ...metadata,
        currency: "USD",
      })
    }
  }

  await entry.commit()

  return entry
}

export const addColdStoragePayment = async ({ description, amount, fee, metadata }) => {
  const txMetadata = {
    currency: "BTC",
    type: "to_cold_storage",
    pending: false,
    fee,
    ...metadata,
  }

  const bankOwnerPath = await bankOwnerAccountPath()

  return await MainBook.entry(description)
    .credit(lndAccountingPath, amount + fee, txMetadata)
    .debit(bankOwnerPath, fee, txMetadata)
    .debit(bitcoindAccountingPath, amount, txMetadata)
    .commit()
}

export const addHotWalletPayment = async ({ description, amount, fee, hash }) => {
  const txMetadata = {
    currency: "BTC",
    type: "to_hot_wallet",
    pending: false,
    fee,
    hash,
  }

  const bankOwnerPath = await bankOwnerAccountPath()

  return await MainBook.entry(description)
    .debit(lndAccountingPath, amount, txMetadata)
    .debit(bankOwnerPath, fee, txMetadata)
    .credit(bitcoindAccountingPath, amount + fee, txMetadata)
    .commit()
}

export const voidTransactions = (journalId, reason) => {
  return MainBook.void(journalId, reason)
}

export const settlePayment = async (hash) => {
  const result = await Transaction.updateMany({ hash }, { pending: false })
  return result.nModified > 0
}

export const settleLndPayment = (hash) => {
  return settlePayment(hash)
}

export const settleOnchainPayment = (hash) => {
  return settlePayment(hash)
}

export const rebalancePortfolio = async ({ description, metadata, wallet }) => {
  const dealerPath = await dealerAccountPath()

  const balances = await wallet.getBalances()

  const expectedBtc = wallet.user.ratioBtc * balances.total_in_BTC
  const expectedUsd = wallet.user.ratioUsd * balances.total_in_USD

  const diffBtc = expectedBtc - balances.BTC
  const btcAmount = Math.abs(diffBtc)
  const usdAmount = Math.abs(expectedUsd - balances.USD)

  const buyOrSell = diffBtc ? (diffBtc > 0 ? "buy" : "sell") : null

  const entry = MainBook.entry(description)

  // user buy btc
  if (buyOrSell === "buy") {
    entry
      .credit(wallet.user.accountPath, btcAmount, { ...metadata, currency: "BTC" })
      .debit(dealerPath, btcAmount, { ...metadata, currency: "BTC" })

      .debit(wallet.user.accountPath, usdAmount, { ...metadata, currency: "USD" })
      .credit(dealerPath, usdAmount, { ...metadata, currency: "USD" })
    // user sell btc
  } else if (buyOrSell === "sell") {
    entry
      .debit(wallet.user.accountPath, btcAmount, { ...metadata, currency: "BTC" })
      .credit(dealerPath, btcAmount, { ...metadata, currency: "BTC" })

      .credit(wallet.user.accountPath, usdAmount, { ...metadata, currency: "USD" })
      .debit(dealerPath, usdAmount, { ...metadata, currency: "USD" })
  } else {
    // no-op
    return null
  }

  await entry.commit()
  return null
}
