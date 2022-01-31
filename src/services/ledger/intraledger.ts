import assert from "assert"

import { LedgerTransactionType, toLiabilitiesWalletId } from "@domain/ledger"
import { LedgerError, UnknownLedgerError } from "@domain/ledger/errors"

import { WalletCurrency } from "@domain/wallets"

import { MainBook } from "./books"

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
  }: AddOnChainIntraledgerTxSendArgs): Promise<LedgerJournal | LedgerError> => {
    const metadata: AddOnChainIntraledgerTxSendMetadata = {
      type: LedgerTransactionType.OnchainIntraLedger,
      pending: false,
      usd: amountDisplayCurrency,
      memoPayer: null,
      username: null,
      payee_addresses: payeeAddresses,
      sendAll,
    }

    return addIntraledgerTxSend({
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

  addWalletIdIntraledgerTxSend: async ({
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
  }: addWalletIdIntraledgerTxSendArgs): Promise<LedgerJournal | LedgerError> => {
    const metadata: AddWalletIdIntraledgerTxSendMetadata = {
      type: LedgerTransactionType.IntraLedger,
      pending: false,
      usd: amountDisplayCurrency,
      memoPayer: null,
      username: null,
    }

    return addIntraledgerTxSend({
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

  addLnIntraledgerTxSend: async ({
    senderWalletId,
    senderWalletCurrency,
    senderUsername,
    paymentHash,
    description,
    sats,
    amountDisplayCurrency,
    pubkey,
    recipientWalletId,
    recipientWalletCurrency,
    recipientUsername,
    memoPayer,
  }: AddLnIntraledgerTxSendArgs): Promise<LedgerJournal | LedgerError> => {
    const metadata: AddLnIntraledgerTxSendMetadata = {
      type: LedgerTransactionType.IntraLedger,
      pending: false,
      hash: paymentHash,
      usd: amountDisplayCurrency,
      pubkey,
      memoPayer: null,
      username: null,
    }

    return addIntraledgerTxSend({
      senderWalletId,
      senderWalletCurrency,
      senderUsername,
      description,
      sats,
      recipientWalletId,
      recipientUsername,
      recipientWalletCurrency,
      memoPayer,
      shareMemoWithPayee: false,
      metadata,
    })
  },
}

const addIntraledgerTxSend = async ({
  senderWalletId,
  senderWalletCurrency,
  senderUsername,
  description,
  sats,
  recipientWalletId,
  recipientUsername,
  recipientWalletCurrency,
  memoPayer,
  shareMemoWithPayee,
  metadata,
}: SendIntraledgerTxArgs): Promise<LedgerJournal | LedgerError> => {
  const senderLiabilitiesWalletId = toLiabilitiesWalletId(senderWalletId)
  const recipientLiabilitiesWalletId = toLiabilitiesWalletId(recipientWalletId)

  // TODO: remove assert once dealer has been implemented
  assert(recipientWalletCurrency === WalletCurrency.Btc)
  assert(senderWalletCurrency === WalletCurrency.Btc)

  try {
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

    const entry = MainBook.entry(description)

    entry
      .credit(recipientLiabilitiesWalletId, sats, creditMetadata)
      .debit(senderLiabilitiesWalletId, sats, debitMetadata)

    const savedEntry = await entry.commit()
    return translateToLedgerJournal(savedEntry)
  } catch (err) {
    return new UnknownLedgerError(err)
  }
}
