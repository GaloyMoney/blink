import { LedgerTransactionType } from "@domain/ledger"
import { LedgerError, UnknownLedgerError } from "@domain/ledger/errors"
import {
  paymentAmountFromSats,
  paymentAmountFromCents,
  WalletCurrency,
} from "@domain/shared"

import { NotReachableError } from "@domain/errors"

import { EntryBuilder, toLedgerAccountId } from "./domain"

import { MainBook } from "./books"
import * as caching from "./caching"
import { TransactionsMetadataRepository } from "./services"

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
      paymentHash,
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
  paymentHash,
}: SendIntraledgerTxArgs): Promise<LedgerJournal | LedgerError> => {
  const senderAccountId = toLedgerAccountId(senderWalletId)
  const recipientAccountId = toLedgerAccountId(recipientWalletId)

  const staticAccountIds = {
    bankOwnerAccountId: toLedgerAccountId(await caching.getBankOwnerWalletId()),
    dealerBtcAccountId: toLedgerAccountId(await caching.getDealerBtcWalletId()),
    dealerUsdAccountId: toLedgerAccountId(await caching.getDealerUsdWalletId()),
  }
  const txMetadataRepo = TransactionsMetadataRepository()

  const sharedMetadata = {
    ...metadata,
    username: senderUsername,
    memoPayer: shareMemoWithPayee ? memoPayer : null,
  }

  let entry = MainBook.entry(description)
  const builder = EntryBuilder({
    staticAccountIds,
    entry,
    metadata: sharedMetadata,
  }).withoutFee()

  if (
    recipientWalletCurrency === WalletCurrency.Btc &&
    senderWalletCurrency === WalletCurrency.Btc
  ) {
    if (sats === undefined) {
      return new NotReachableError("sats undefined implementation error")
    }
    entry = builder
      .debitAccount({
        accountId: senderAccountId,
        amount: paymentAmountFromSats(sats),
        additionalMetadata: {
          memoPayer,
          username: recipientUsername,
        },
      })
      .creditAccount({
        accountId: recipientAccountId,
      })
  } else if (
    recipientWalletCurrency === WalletCurrency.Usd &&
    senderWalletCurrency === WalletCurrency.Usd
  ) {
    if (cents === undefined) {
      return new Error("cents undefined implementation error")
    }
    entry = builder
      .debitAccount({
        accountId: senderAccountId,
        amount: paymentAmountFromCents(cents),
        additionalMetadata: {
          memoPayer,
          username: recipientUsername,
        },
      })
      .creditAccount({
        accountId: recipientAccountId,
      })
  } else if (
    recipientWalletCurrency === WalletCurrency.Btc &&
    senderWalletCurrency === WalletCurrency.Usd
  ) {
    if (cents === undefined || sats === undefined) {
      return new Error("cents or sats undefined implementation error")
    }

    entry = builder
      .debitAccount({
        accountId: senderAccountId,
        amount: paymentAmountFromCents(cents),
        additionalMetadata: {
          memoPayer,
          username: recipientUsername,
        },
      })
      .creditAccount({
        accountId: recipientAccountId,
        btcAmountForUsdDebit: paymentAmountFromSats(sats),
      })
  } else {
    // if (
    //   recipientWalletCurrency === WalletCurrency.Usd &&
    //   senderWalletCurrency === WalletCurrency.Btc
    // )
    if (cents === undefined || sats === undefined) {
      return new Error("cents or sats undefined implementation error")
    }

    entry = builder
      .debitAccount({
        accountId: senderAccountId,
        amount: paymentAmountFromSats(sats),
        additionalMetadata: {
          memoPayer,
          username: recipientUsername,
        },
      })
      .creditAccount({
        accountId: recipientAccountId,
        usdAmountForBtcDebit: paymentAmountFromCents(cents),
      })
  }

  try {
    const savedEntry = await entry.commit()
    const journalEntry = translateToLedgerJournal(savedEntry)

    const txsMetadataToPersist = journalEntry.transactionIds.map((id) => ({
      id,
      hash: paymentHash,
    }))
    txMetadataRepo.persistAll(txsMetadataToPersist)

    return journalEntry
  } catch (err) {
    return new UnknownLedgerError(err)
  }
}
