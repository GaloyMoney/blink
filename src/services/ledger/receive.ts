import {
  paymentAmountFromSats,
  paymentAmountFromCents,
  WalletCurrency,
} from "@domain/shared"
import { NotImplementedError, NotReachableError } from "@domain/errors"

import { LedgerTransactionType } from "@domain/ledger"
import { LedgerError, UnknownLedgerError } from "@domain/ledger/errors"

import { MainBook } from "./books"
import * as caching from "./caching"
import { EntryBuilder, toLedgerAccountId } from "./domain"

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

  addLnTxReceive: async ({
    walletId,
    walletCurrency,
    paymentHash,
    description,
    sats,
    feeInboundLiquidityDisplayCurrency,
    amountDisplayCurrency,
    feeInboundLiquidity,
    cents,
  }: AddLnTxReceiveArgs): Promise<LedgerJournal | LedgerError> => {
    const metadata: LnReceiveLedgerMetadata = {
      type: LedgerTransactionType.Invoice,
      pending: false,
      hash: paymentHash,
      fee: feeInboundLiquidity,
      feeUsd: feeInboundLiquidityDisplayCurrency,
      usd: amountDisplayCurrency,
    }

    if (feeInboundLiquidity > 0) {
      return addReceiptFee({
        metadata,
        walletId,
        walletCurrency,
        sats,
        fee: feeInboundLiquidity,
        description,
      })
    } else {
      return addReceiptNoFee({
        metadata,
        walletId,
        walletCurrency,
        sats,
        cents,
        description,
      })
    }
  },

  // this use case run for a lightning payment (not on an initial receive),
  // when the sender overpaid in fee;
  // the bankowner needs to reimburse the end user
  addLnFeeReimbursementReceive: async ({
    walletId,
    walletCurrency,
    paymentHash,
    amountDisplayCurrency,
    journalId,
    sats,
    cents,
    revealedPreImage,
  }: AddLnFeeReeimbursementReceiveArgs): Promise<LedgerJournal | LedgerError> => {
    const metadata: FeeReimbursementLedgerMetadata = {
      type: LedgerTransactionType.LnFeeReimbursement,
      hash: paymentHash,
      related_journal: journalId,
      pending: false,
      usd: amountDisplayCurrency,
    }

    const description = "fee reimbursement"
    return addReceiptNoFee({
      metadata,
      description,
      walletId,
      sats,
      walletCurrency,
      cents,
      revealedPreImage,
    })
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
  let entry = MainBook.entry(description)
  const builder = EntryBuilder({
    staticAccountIds,
    entry,
    metadata: metaInput,
  })
    .withoutFee()
    .debitLnd(paymentAmountFromSats(sats))

  if (walletCurrency === WalletCurrency.Btc) {
    entry = builder.creditAccount({ accountId })
  } else {
    if (cents === undefined) return new NotReachableError("cents should be defined here")
    entry = builder.creditAccount({
      accountId,
      usdAmountForBtcDebit: paymentAmountFromCents(cents),
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

  const entry = MainBook.entry(description)
  const builder = EntryBuilder({
    staticAccountIds,
    entry,
    metadata: metaInput,
  })
    .withFee(paymentAmountFromSats(fee))
    .debitLnd(paymentAmountFromSats(sats))
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
