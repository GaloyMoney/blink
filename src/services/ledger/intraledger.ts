import { LedgerTransactionType } from "@domain/ledger"
import { LedgerError, UnknownLedgerError } from "@domain/ledger/errors"
import { WalletCurrency, paymentAmountFromNumber } from "@domain/shared"

import { NotReachableError } from "@domain/errors"

import { LegacyEntryBuilder, toLedgerAccountId } from "./domain"

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
    memoPayer: shareMemoWithPayee ? memoPayer : undefined,
  }

  let entry = MainBook.entry(description)
  const builder = LegacyEntryBuilder({
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

    const satsAmount = paymentAmountFromNumber({
      amount: sats,
      currency: WalletCurrency.Btc,
    })
    if (satsAmount instanceof Error) return satsAmount

    entry = builder
      .debitAccount({
        accountId: senderAccountId,
        amount: satsAmount,
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

    const centsAmount = paymentAmountFromNumber({
      amount: cents,
      currency: WalletCurrency.Usd,
    })
    if (centsAmount instanceof Error) return centsAmount

    entry = builder
      .debitAccount({
        accountId: senderAccountId,
        amount: centsAmount,
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

    const centsAmount = paymentAmountFromNumber({
      amount: cents,
      currency: WalletCurrency.Usd,
    })
    if (centsAmount instanceof Error) return centsAmount
    const satsAmount = paymentAmountFromNumber({
      amount: sats,
      currency: WalletCurrency.Btc,
    })
    if (satsAmount instanceof Error) return satsAmount

    entry = builder
      .debitAccount({
        accountId: senderAccountId,
        amount: centsAmount,
        additionalMetadata: {
          memoPayer,
          username: recipientUsername,
        },
      })
      .creditAccount({
        accountId: recipientAccountId,
        amount: satsAmount,
      })
  } else {
    // if (
    //   recipientWalletCurrency === WalletCurrency.Usd &&
    //   senderWalletCurrency === WalletCurrency.Btc
    // )
    if (cents === undefined || sats === undefined) {
      return new Error("cents or sats undefined implementation error")
    }

    const centsAmount = paymentAmountFromNumber({
      amount: cents,
      currency: WalletCurrency.Usd,
    })
    if (centsAmount instanceof Error) return centsAmount
    const satsAmount = paymentAmountFromNumber({
      amount: sats,
      currency: WalletCurrency.Btc,
    })
    if (satsAmount instanceof Error) return satsAmount

    entry = builder
      .debitAccount({
        accountId: senderAccountId,
        amount: satsAmount,
        additionalMetadata: {
          memoPayer,
          username: recipientUsername,
        },
      })
      .creditAccount({
        accountId: recipientAccountId,
        amount: centsAmount,
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
