import { WalletCurrency, paymentAmountFromNumber } from "@domain/shared"
import { NotImplementedError, NotReachableError } from "@domain/errors"

import { LedgerTransactionType } from "@domain/ledger"
import { LedgerError, UnknownLedgerError } from "@domain/ledger/errors"

import { MainBook } from "./books"
import * as caching from "./caching"
import { LegacyEntryBuilder, toLedgerAccountId } from "./domain"

import { TransactionsMetadataRepository } from "./services"

import { translateToLedgerJournal } from "."

const txMetadataRepo = TransactionsMetadataRepository()

export const receive = {
  addOnChainTxReceive: async ({
    walletId,
    walletCurrency,
    txHash,
    sats,
    fee,
    feeDisplayCurrency,
    amountDisplayCurrency,
    receivingAddress,
  }: ReceiveOnChainTxArgs): Promise<LedgerJournal | LedgerError> => {
    const metadata: OnChainReceiveLedgerMetadata = {
      type: LedgerTransactionType.OnchainReceipt,
      pending: false,
      hash: txHash,
      fee,
      feeUsd: feeDisplayCurrency,
      usd: amountDisplayCurrency,
      payee_addresses: [receivingAddress],
    }

    const description = ""

    if (fee > 0) {
      return addReceiptFee({
        metadata,
        walletId,
        walletCurrency,
        sats,
        fee,
        description,
      })
    } else {
      return addReceiptNoFee({
        metadata,
        walletId,
        walletCurrency,
        sats,
        description,
      })
    }
  },
}

const addReceiptNoFee = async ({
  metadata: metaInput,
  walletId,
  walletCurrency,
  sats,
  cents,
  description,
  revealedPreImage,
}: {
  metadata: ReceiveLedgerMetadata
  walletId: WalletId
  walletCurrency: WalletCurrency
  sats: Satoshis
  cents?: UsdCents
  description: string
  revealedPreImage?: RevealedPreImage
}) => {
  const accountId = toLedgerAccountId(walletId)
  const staticAccountIds = {
    bankOwnerAccountId: toLedgerAccountId(await caching.getBankOwnerWalletId()),
    dealerBtcAccountId: toLedgerAccountId(await caching.getDealerBtcWalletId()),
    dealerUsdAccountId: toLedgerAccountId(await caching.getDealerUsdWalletId()),
  }

  const satsAmount = paymentAmountFromNumber({
    amount: sats,
    currency: WalletCurrency.Btc,
  })
  if (satsAmount instanceof Error) return satsAmount

  let entry = MainBook.entry(description)
  const builder = LegacyEntryBuilder({
    staticAccountIds,
    entry,
    metadata: metaInput,
  })
    .withoutFee()
    .debitLnd(satsAmount)

  if (walletCurrency === WalletCurrency.Btc) {
    entry = builder.creditAccount({ accountId })
  } else {
    if (cents === undefined) return new NotReachableError("cents should be defined here")
    const centsAmount = paymentAmountFromNumber({
      amount: cents,
      currency: WalletCurrency.Usd,
    })
    if (centsAmount instanceof Error) return centsAmount

    entry = builder.creditAccount({
      accountId,
      amount: centsAmount,
    })
  }
  try {
    const savedEntry = await entry.commit()
    const journalEntry = translateToLedgerJournal(savedEntry)

    const txsMetadataToPersist = journalEntry.transactionIds.map((id) => ({
      id,
      hash: metaInput.hash,
      revealedPreImage,
    }))
    txMetadataRepo.persistAll(txsMetadataToPersist)

    return journalEntry
  } catch (err) {
    return new UnknownLedgerError(err)
  }
}

const addReceiptFee = async ({
  metadata: metaInput,
  fee,
  walletId,
  walletCurrency,
  sats,
  description,
}: {
  metadata: ReceiveLedgerMetadata
  fee: Satoshis
  walletId: WalletId
  walletCurrency: WalletCurrency
  sats: Satoshis
  description: string
}) => {
  const accountId = toLedgerAccountId(walletId)
  const staticAccountIds = {
    bankOwnerAccountId: toLedgerAccountId(await caching.getBankOwnerWalletId()),
    dealerBtcAccountId: toLedgerAccountId(await caching.getDealerBtcWalletId()),
    dealerUsdAccountId: toLedgerAccountId(await caching.getDealerUsdWalletId()),
  }

  // TODO: remove once implemented
  if (walletCurrency !== WalletCurrency.Btc) {
    return new NotImplementedError("USD Intraledger")
  }

  const feeSatsAmount = paymentAmountFromNumber({
    amount: fee,
    currency: WalletCurrency.Btc,
  })
  if (feeSatsAmount instanceof Error) return feeSatsAmount
  const satsAmount = paymentAmountFromNumber({
    amount: sats,
    currency: WalletCurrency.Btc,
  })
  if (satsAmount instanceof Error) return satsAmount

  const entry = MainBook.entry(description)
  const builder = LegacyEntryBuilder({
    staticAccountIds,
    entry,
    metadata: metaInput,
  })
    .withFee(feeSatsAmount)
    .debitLnd(satsAmount)
    .creditAccount({ accountId })

  try {
    const savedEntry = await builder.commit()
    const journalEntry = translateToLedgerJournal(savedEntry)

    const txsMetadataToPersist = journalEntry.transactionIds.map((id) => ({
      id,
      hash: metaInput.hash,
    }))
    txMetadataRepo.persistAll(txsMetadataToPersist)

    return journalEntry
  } catch (err) {
    return new UnknownLedgerError(err)
  }
}
