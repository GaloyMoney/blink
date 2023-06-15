import { ZERO_BANK_FEE } from "@domain/shared"

import { MainBook } from "../books"

import { EntryBuilder, toLedgerAccountDescriptor } from "../domain"
import { persistAndReturnEntry } from "../helpers"

import { staticAccountIds } from "./shared"

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
