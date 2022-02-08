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
