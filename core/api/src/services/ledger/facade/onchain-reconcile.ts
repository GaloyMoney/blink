import { MainBook } from "../books"

import { persistAndReturnEntry } from "../helpers"
import { FeeOnlyEntryBuilder } from "../domain/fee-only-entry-builder"

import { staticAccountIds } from "./static-account-ids"

import { AmountCalculator } from "@/domain/shared"

const calc = AmountCalculator()

export const recordReceiveOnChainFeeReconciliation = async ({
  estimatedFee,
  actualFee,
  metadata,
}: {
  estimatedFee: BtcPaymentAmount
  actualFee: BtcPaymentAmount
  metadata: AddOnChainFeeReconciliationLedgerMetadata
}) => {
  const accountIds = await staticAccountIds()
  if (accountIds instanceof Error) return accountIds

  let entry = MainBook.entry("")
  if (actualFee.amount > estimatedFee.amount) {
    const btcFeeDifference = calc.sub(actualFee, estimatedFee)
    const builder = FeeOnlyEntryBuilder({
      staticAccountIds: accountIds,
      entry,
      metadata,
      btcFee: btcFeeDifference,
    })
    entry = builder.debitBankOwner().creditOnChain()
  } else {
    const btcFeeDifference = calc.sub(estimatedFee, actualFee)
    const builder = FeeOnlyEntryBuilder({
      staticAccountIds: accountIds,
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
