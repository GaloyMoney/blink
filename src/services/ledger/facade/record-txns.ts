import { AmountCalculator, ZERO_BANK_FEE, ZERO_CENTS, ZERO_SATS } from "@domain/shared"

import { MainBook } from "../books"

import * as caching from "../caching"
import { EntryBuilder, toLedgerAccountDescriptor, toLedgerAccountId } from "../domain"
import { FeeOnlyEntryBuilder } from "../domain/fee-only-entry-builder"
import { UnknownLedgerError } from "../domain/errors"
import { persistAndReturnEntry } from "../helpers"
import { TransactionsMetadataRepository } from "../services"

import { translateToLedgerJournal } from ".."

const calc = AmountCalculator()

export const staticAccountIds = async () => {
  return {
    bankOwnerAccountId: toLedgerAccountId(await caching.getBankOwnerWalletId()),
    dealerBtcAccountId: toLedgerAccountId(await caching.getDealerBtcWalletId()),
    dealerUsdAccountId: toLedgerAccountId(await caching.getDealerUsdWalletId()),
  }
}

export const recordSendOffChain = async ({
  description,
  senderWalletDescriptor,
  amountToDebitSender,
  bankFee,
  metadata,
  additionalDebitMetadata,
  additionalInternalMetadata,
}: RecordSendArgs) => {
  const actualFee = bankFee || { usd: ZERO_CENTS, btc: ZERO_SATS }

  let entry = MainBook.entry(description)
  const builder = EntryBuilder({
    staticAccountIds: await staticAccountIds(),
    entry,
    metadata,
    additionalInternalMetadata,
  })

  entry = builder
    .withTotalAmount({
      usdWithFees: amountToDebitSender.usd,
      btcWithFees: amountToDebitSender.btc,
    })
    .withBankFee({ usdBankFee: actualFee.usd, btcBankFee: actualFee.btc })
    .debitAccount({
      accountDescriptor: toLedgerAccountDescriptor(senderWalletDescriptor),
      additionalMetadata: additionalDebitMetadata,
    })
    .creditOffChain()

  return persistAndReturnEntry({ entry, hash: metadata.hash })
}

export const recordSendOnChain = async ({
  description,
  senderWalletDescriptor,
  amountToDebitSender,
  bankFee,
  metadata,
  additionalDebitMetadata,
  additionalInternalMetadata,
}: RecordSendArgs) => {
  const actualFee = bankFee || { usd: ZERO_CENTS, btc: ZERO_SATS }

  let entry = MainBook.entry(description)
  const builder = EntryBuilder({
    staticAccountIds: await staticAccountIds(),
    entry,
    metadata,
    additionalInternalMetadata,
  })

  entry = builder
    .withTotalAmount({
      usdWithFees: amountToDebitSender.usd,
      btcWithFees: amountToDebitSender.btc,
    })
    .withBankFee({ usdBankFee: actualFee.usd, btcBankFee: actualFee.btc })
    .debitAccount({
      accountDescriptor: toLedgerAccountDescriptor(senderWalletDescriptor),
      additionalMetadata: additionalDebitMetadata,
    })
    .creditOnChain()

  return persistAndReturnEntry({ entry, hash: metadata.hash })
}

export const recordReceiveOffChain = async ({
  description,
  recipientWalletDescriptor,
  amountToCreditReceiver,
  bankFee,
  metadata,
  txMetadata,
  additionalCreditMetadata,
  additionalInternalMetadata,
}: RecordReceiveArgs) => {
  const actualFee = bankFee || { usd: ZERO_CENTS, btc: ZERO_SATS }

  let entry = MainBook.entry(description)
  const builder = EntryBuilder({
    staticAccountIds: await staticAccountIds(),
    entry,
    metadata,
    additionalInternalMetadata,
  })

  const amountWithFees = {
    usdWithFees: calc.add(amountToCreditReceiver.usd, actualFee.usd),
    btcWithFees: calc.add(amountToCreditReceiver.btc, actualFee.btc),
  }

  entry = builder
    .withTotalAmount(amountWithFees)
    .withBankFee({ usdBankFee: actualFee.usd, btcBankFee: actualFee.btc })
    .debitLnd()
    .creditAccount({
      accountDescriptor: toLedgerAccountDescriptor(recipientWalletDescriptor),
      additionalMetadata: additionalCreditMetadata,
    })

  return persistAndReturnEntry({ entry, ...txMetadata })
}

export const recordReceiveOnChain = async ({
  description,
  recipientWalletDescriptor,
  amountToCreditReceiver,
  bankFee,
  metadata,
  txMetadata,
  additionalCreditMetadata,
  additionalInternalMetadata,
}: RecordReceiveArgs) => {
  const actualFee = bankFee || { usd: ZERO_CENTS, btc: ZERO_SATS }

  let entry = MainBook.entry(description)
  const builder = EntryBuilder({
    staticAccountIds: await staticAccountIds(),
    entry,
    metadata,
    additionalInternalMetadata,
  })

  const amountWithFees = {
    usdWithFees: calc.add(amountToCreditReceiver.usd, actualFee.usd),
    btcWithFees: calc.add(amountToCreditReceiver.btc, actualFee.btc),
  }

  entry = builder
    .withTotalAmount(amountWithFees)
    .withBankFee({ usdBankFee: actualFee.usd, btcBankFee: actualFee.btc })
    .debitOnChain()
    .creditAccount({
      accountDescriptor: toLedgerAccountDescriptor(recipientWalletDescriptor),
      additionalMetadata: additionalCreditMetadata,
    })

  return persistAndReturnEntry({ entry, ...txMetadata })
}

export const recordReceiveOnChainFeeReconciliation = async ({
  estimatedFee,
  actualFee,
  metadata,
}: {
  estimatedFee: BtcPaymentAmount
  actualFee: BtcPaymentAmount
  metadata: AddOnChainFeeReconciliationLedgerMetadata
}) => {
  let entry = MainBook.entry("")
  if (actualFee.amount > estimatedFee.amount) {
    const btcFeeDifference = calc.sub(actualFee, estimatedFee)
    const builder = FeeOnlyEntryBuilder({
      staticAccountIds: await staticAccountIds(),
      entry,
      metadata,
      btcFee: btcFeeDifference,
    })
    entry = builder.debitBankOwner().creditOnChain()
  } else {
    const btcFeeDifference = calc.sub(estimatedFee, actualFee)
    const builder = FeeOnlyEntryBuilder({
      staticAccountIds: await staticAccountIds(),
      entry,
      metadata,
      btcFee: btcFeeDifference,
    })
    entry = builder.debitOnChain().creditBankOwner()
  }

  return persistAndReturnEntry({
    entry,
    hash: metadata.hash,
  })
}

export const recordIntraledger = async ({
  description,
  senderWalletDescriptor,
  recipientWalletDescriptor,
  amount,
  metadata,
  additionalDebitMetadata,
  additionalCreditMetadata,
  additionalInternalMetadata,
}: RecordIntraledgerArgs) => {
  let entry = MainBook.entry(description)
  const builder = EntryBuilder({
    staticAccountIds: await staticAccountIds(),
    entry,
    metadata,
    additionalInternalMetadata,
  })

  entry = builder
    .withTotalAmount({ usdWithFees: amount.usd, btcWithFees: amount.btc })
    .withBankFee(ZERO_BANK_FEE)
    .debitAccount({
      accountDescriptor: toLedgerAccountDescriptor(senderWalletDescriptor),
      additionalMetadata: additionalDebitMetadata,
    })
    .creditAccount({
      accountDescriptor: toLedgerAccountDescriptor(recipientWalletDescriptor),
      additionalMetadata: additionalCreditMetadata,
    })

  return persistAndReturnEntry({
    entry,
    hash: "hash" in metadata ? metadata.hash : undefined,
  })
}

export const recordLnSendRevert = async ({
  journalId,
  paymentHash,
}: RevertLightningPaymentArgs): Promise<true | LedgerServiceError> => {
  const reason = "Payment canceled"
  try {
    const txMetadataRepo = TransactionsMetadataRepository()

    const savedEntry = await MainBook.void(journalId, reason)
    const journalEntry = translateToLedgerJournal(savedEntry)

    const txsMetadataToPersist = journalEntry.transactionIds.map((id) => ({
      id,
      hash: paymentHash,
    }))
    txMetadataRepo.persistAll(txsMetadataToPersist)
    return true
  } catch (err) {
    return new UnknownLedgerError(err)
  }
}
