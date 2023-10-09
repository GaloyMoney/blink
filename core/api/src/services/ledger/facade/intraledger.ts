import { MainBook } from "../books"

import { EntryBuilder, toLedgerAccountDescriptor } from "../domain"
import { persistAndReturnEntry } from "../helpers"

import { staticAccountIds } from "./static-account-ids"

import { ZERO_BANK_FEE } from "@/domain/shared"

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
  const accountIds = await staticAccountIds()
  if (accountIds instanceof Error) return accountIds

  let entry = MainBook.entry(description)
  const builder = EntryBuilder({
    staticAccountIds: accountIds,
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
