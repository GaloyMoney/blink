import { LedgerTransactionType, toLiabilitiesWalletId } from "@domain/ledger"
import { LedgerError, UnknownLedgerError } from "@domain/ledger/errors"
import { WalletCurrency } from "@domain/wallets"

import { NotReachableError } from "@domain/errors"

import { MainBook } from "./books"
import { getDealerBtcWalletId, getDealerUsdWalletId } from "./caching"

import { translateToLedgerJournal } from "."

export const intraledger = {
  addOnChainIntraledgerTxTransfer: async ({
    senderWalletId,
    senderWalletCurrency,
    senderUsername,
    description,
    sats,
    amountDisplayCurrency,
    payeeAddresses,
    sendAll,
    recipientWalletId,
    recipientWalletCurrency,
    recipientUsername,
    memoPayer,
  }: AddOnChainIntraledgerTxTransferArgs): Promise<LedgerJournal | LedgerError> => {
    const metadata: AddOnChainIntraledgerSendLedgerMetadata = {
      type: LedgerTransactionType.OnchainIntraLedger,
      pending: false,
      usd: amountDisplayCurrency,
      memoPayer: undefined,
      username: undefined,
      payee_addresses: payeeAddresses,
      sendAll,
    }

    return addIntraledgerTxTransfer({
      senderWalletId,
      senderWalletCurrency,
      senderUsername,
      description,
      sats,
      recipientWalletId,
      recipientWalletCurrency,
      recipientUsername,
      memoPayer,
      shareMemoWithPayee: false,
      metadata,
    })
  },

  addWalletIdIntraledgerTxTransfer: async ({
    senderWalletId,
    senderWalletCurrency,
    senderUsername,
    description,
    sats,
    amountDisplayCurrency,
    recipientWalletId,
    recipientWalletCurrency,
    recipientUsername,
    memoPayer,
  }: AddWalletIdIntraledgerTxTransferArgs): Promise<LedgerJournal | LedgerError> => {
    const metadata: AddWalletIdIntraledgerSendLedgerMetadata = {
      type: LedgerTransactionType.IntraLedger,
      pending: false,
      usd: amountDisplayCurrency,
      memoPayer: undefined,
      username: undefined,
    }

    return addIntraledgerTxTransfer({
      senderWalletId,
      senderWalletCurrency,
      senderUsername,
      description,
      sats,
      recipientWalletId,
      recipientWalletCurrency,
      recipientUsername,
      memoPayer,
      shareMemoWithPayee: true,
      metadata,
    })
  },

  addLnIntraledgerTxTransfer: async ({
    senderWalletId,
    senderWalletCurrency,
    senderUsername,
    paymentHash,
    description,
    sats,
    cents,
    amountDisplayCurrency,
    pubkey,
    recipientWalletId,
    recipientWalletCurrency,
    recipientUsername,
    memoPayer,
  }: AddLnIntraledgerTxTransferArgs): Promise<LedgerJournal | LedgerError> => {
    const metadata: AddLnIntraledgerSendLedgerMetadata = {
      type: LedgerTransactionType.IntraLedger,
      pending: false,
      hash: paymentHash,
      usd: amountDisplayCurrency,
      pubkey,
      memoPayer: undefined,
      username: undefined,
    }

    return addIntraledgerTxTransfer({
      senderWalletId,
      senderWalletCurrency,
      senderUsername,
      description,
      sats,
      cents,
      recipientWalletId,
      recipientUsername,
      recipientWalletCurrency,
      memoPayer,
      shareMemoWithPayee: false,
      metadata,
    })
  },
}

const addIntraledgerTxTransfer = async ({
  senderWalletId,
  senderWalletCurrency,
  senderUsername,
  description,
  sats,
  cents,
  recipientWalletId,
  recipientUsername,
  recipientWalletCurrency,
  memoPayer,
  shareMemoWithPayee,
  metadata,
}: SendIntraledgerTxArgs): Promise<LedgerJournal | LedgerError> => {
  const senderLiabilitiesWalletId = toLiabilitiesWalletId(senderWalletId)
  const recipientLiabilitiesWalletId = toLiabilitiesWalletId(recipientWalletId)

  const entry = MainBook.entry(description)

  if (
    recipientWalletCurrency === WalletCurrency.Btc &&
    senderWalletCurrency === WalletCurrency.Btc
  ) {
    const creditMetadata = {
      ...metadata,
      currency: WalletCurrency.Btc,
      username: senderUsername,
      memoPayer: shareMemoWithPayee ? memoPayer : null,
    }
    const debitMetadata = {
      ...metadata,
      currency: WalletCurrency.Btc,
      username: recipientUsername,
      memoPayer,
    }
    if (sats === undefined) {
      return new NotReachableError("sats undefined implementation error")
    }

    try {
      entry
        .credit(recipientLiabilitiesWalletId, sats, creditMetadata)
        .debit(senderLiabilitiesWalletId, sats, debitMetadata)

      const savedEntry = await entry.commit()
      return translateToLedgerJournal(savedEntry)
    } catch (err) {
      return new UnknownLedgerError(err)
    }
  } else if (
    recipientWalletCurrency === WalletCurrency.Usd &&
    senderWalletCurrency === WalletCurrency.Usd
  ) {
    const creditMetadata = {
      ...metadata,
      currency: WalletCurrency.Usd,
      username: senderUsername,
      memoPayer: shareMemoWithPayee ? memoPayer : null,
    }
    const debitMetadata = {
      ...metadata,
      currency: WalletCurrency.Usd,
      username: recipientUsername,
      memoPayer,
    }
    if (cents === undefined) {
      return new Error("cents undefined implementation error")
    }

    try {
      entry
        .credit(recipientLiabilitiesWalletId, cents, creditMetadata)
        .debit(senderLiabilitiesWalletId, cents, debitMetadata)

      const savedEntry = await entry.commit()
      return translateToLedgerJournal(savedEntry)
    } catch (err) {
      return new UnknownLedgerError(err)
    }
  } else if (
    recipientWalletCurrency === WalletCurrency.Btc &&
    senderWalletCurrency === WalletCurrency.Usd
  ) {
    const creditMetadata = {
      ...metadata,
      currency: WalletCurrency.Btc,
      username: senderUsername,
      memoPayer: shareMemoWithPayee ? memoPayer : null,
    }
    const debitMetadata = {
      ...metadata,
      currency: WalletCurrency.Usd,
      username: recipientUsername,
      memoPayer,
    }
    if (cents === undefined && sats === undefined) {
      return new Error("cents or sats undefined implementation error")
    }

    const dealerBtcWalletId = await getDealerBtcWalletId()
    const dealerUsdWalletId = await getDealerUsdWalletId()
    const liabilitiesDealerBtcWalletId = toLiabilitiesWalletId(dealerBtcWalletId)
    const liabilitiesDealerUsdWalletId = toLiabilitiesWalletId(dealerUsdWalletId)

    try {
      entry
        .credit(recipientLiabilitiesWalletId, sats, creditMetadata)
        .debit(liabilitiesDealerBtcWalletId, sats, creditMetadata)
        .credit(liabilitiesDealerUsdWalletId, cents, debitMetadata)
        .debit(senderLiabilitiesWalletId, cents, debitMetadata)

      const savedEntry = await entry.commit()
      return translateToLedgerJournal(savedEntry)
    } catch (err) {
      return new UnknownLedgerError(err)
    }
  } else {
    // if (
    //   recipientWalletCurrency === WalletCurrency.Usd &&
    //   senderWalletCurrency === WalletCurrency.Btc
    // )
    const creditMetadata = {
      ...metadata,
      currency: WalletCurrency.Usd,
      username: senderUsername,
      memoPayer: shareMemoWithPayee ? memoPayer : null,
    }
    const debitMetadata = {
      ...metadata,
      currency: WalletCurrency.Btc,
      username: recipientUsername,
      memoPayer,
    }
    if (cents === undefined && sats === undefined) {
      return new Error("cents or sats undefined implementation error")
    }

    const dealerBtcWalletId = await getDealerBtcWalletId()
    const dealerUsdWalletId = await getDealerUsdWalletId()
    const liabilitiesDealerBtcWalletId = toLiabilitiesWalletId(dealerBtcWalletId)
    const liabilitiesDealerUsdWalletId = toLiabilitiesWalletId(dealerUsdWalletId)

    try {
      entry
        .credit(recipientLiabilitiesWalletId, cents, creditMetadata)
        .debit(liabilitiesDealerUsdWalletId, cents, creditMetadata)
        .credit(liabilitiesDealerBtcWalletId, sats, debitMetadata)
        .debit(senderLiabilitiesWalletId, sats, debitMetadata)

      const savedEntry = await entry.commit()
      return translateToLedgerJournal(savedEntry)
    } catch (err) {
      return new UnknownLedgerError(err)
    }
  }
}
