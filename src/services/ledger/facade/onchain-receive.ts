import { AmountCalculator, ZERO_CENTS, ZERO_SATS } from "@domain/shared"

import { MainBook } from "../books"

import { EntryBuilder, toLedgerAccountDescriptor } from "../domain"
import { FeeOnlyEntryBuilder } from "../domain/fee-only-entry-builder"
import { persistAndReturnEntry } from "../helpers"

import { staticAccountIds } from "./shared"

const calc = AmountCalculator()

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
