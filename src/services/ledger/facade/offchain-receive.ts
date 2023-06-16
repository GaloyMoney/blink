import { AmountCalculator, ZERO_CENTS, ZERO_SATS } from "@domain/shared"

import { MainBook } from "../books"

import { EntryBuilder, toLedgerAccountDescriptor } from "../domain"
import { persistAndReturnEntry } from "../helpers"

import { staticAccountIds } from "./shared"

const calc = AmountCalculator()

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
