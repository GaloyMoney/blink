import { LedgerTransactionType, toLiabilitiesWalletId } from "@domain/ledger"
import { LedgerError, UnknownLedgerError } from "@domain/ledger/errors"

import { MainBook } from "./books"

import { translateToLedgerJournal } from "."

export const intraledger = {
  addOnChainIntraledgerTxTransfer: async ({
    senderWalletId,
    description,
    sats,
    fee,
    usd,
    usdFee,
    payeeAddresses,
    sendAll,
    recipientWalletId,
    senderUsername,
    recipientUsername,
    memoPayer,
  }: AddOnChainIntraledgerTxSendArgs): Promise<LedgerJournal | LedgerError> => {
    const metadata: AddOnChainIntraledgerTxSendMetadata = {
      type: LedgerTransactionType.OnchainIntraLedger,
      pending: false,
      fee,
      feeUsd: usdFee,
      sats,
      usd,
      memoPayer: null,
      username: null,
      payee_addresses: payeeAddresses,
      sendAll,
      currency: "BTC",
    }

    return addIntraledgerTxSend({
      senderWalletId,
      description,
      sats,
      recipientWalletId,
      senderUsername,
      recipientUsername,
      memoPayer,
      shareMemoWithPayee: false,
      metadata,
    })
  },

  addWalletIdIntraledgerTxSend: async ({
    senderWalletId,
    description,
    sats,
    fee,
    usd,
    usdFee,
    recipientWalletId,
    senderUsername,
    recipientUsername,
    memoPayer,
  }: addWalletIdIntraledgerTxSendArgs): Promise<LedgerJournal | LedgerError> => {
    const metadata: addWalletIdIntraledgerTxSendMetadata = {
      type: LedgerTransactionType.IntraLedger,
      pending: false,
      fee,
      feeUsd: usdFee,
      sats,
      usd,
      memoPayer: null,
      username: null,
      currency: "BTC",
    }

    return addIntraledgerTxSend({
      senderWalletId,
      description,
      sats,
      recipientWalletId,
      senderUsername,
      recipientUsername,
      memoPayer,
      shareMemoWithPayee: true,
      metadata,
    })
  },

  addLnIntraledgerTxSend: async ({
    senderWalletId,
    paymentHash,
    description,
    sats,
    fee,
    usd,
    usdFee,
    pubkey,
    recipientWalletId,
    senderUsername,
    recipientUsername,
    memoPayer,
  }: AddLnIntraledgerTxSendArgs): Promise<LedgerJournal | LedgerError> => {
    const metadata: AddLnIntraledgerTxSendMetadata = {
      type: LedgerTransactionType.IntraLedger,
      pending: false,
      hash: paymentHash,
      fee,
      feeUsd: usdFee,
      sats,
      usd,
      pubkey,
      memoPayer: null,
      username: null,
      currency: "BTC",
    }

    return addIntraledgerTxSend({
      senderWalletId,
      description,
      sats,
      recipientWalletId,
      senderUsername,
      recipientUsername,
      memoPayer,
      shareMemoWithPayee: false,
      metadata,
    })
  },
}

const addIntraledgerTxSend = async ({
  senderWalletId,
  description,
  sats,
  recipientWalletId,
  senderUsername,
  recipientUsername,
  memoPayer,
  shareMemoWithPayee,
  metadata,
}: SendIntraledgerTxArgs): Promise<LedgerJournal | LedgerError> => {
  const senderLiabilitiesWalletId = toLiabilitiesWalletId(senderWalletId)
  const recipientLiabilitiesWalletId = toLiabilitiesWalletId(recipientWalletId)

  try {
    const creditMetadata = {
      ...metadata,
      username: senderUsername,
      memoPayer: shareMemoWithPayee ? memoPayer : null,
    }
    const debitMetadata = { ...metadata, username: recipientUsername, memoPayer }

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
