import { MainBook } from "../books"

import { translateToLedgerTx } from ".."
import { getBankOwnerWalletId } from "../caching"
import { UnknownLedgerError } from "../domain/errors"
import { persistAndReturnEntry } from "../helpers"
import { FeeOnlyEntryBuilder } from "../domain/fee-only-entry-builder"

import { staticAccountIds } from "./static-account-ids"

import { LedgerTransactionType, toLiabilitiesWalletId } from "@/domain/ledger"
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

export const isOnChainFeeReconciliationTxn = (
  txn: LedgerTransaction<WalletCurrency>,
): boolean =>
  txn.type === LedgerTransactionType.OnchainPayment && txn.address === undefined

export const isOnChainFeeReconciliationRecorded = async (
  payoutId: PayoutId,
): Promise<boolean | LedgerFacadeError> => {
  try {
    const bankOwnerWalletId = await getBankOwnerWalletId()
    const { results } = await MainBook.ledger({
      payout_id: payoutId,
      account: toLiabilitiesWalletId(bankOwnerWalletId),
    })
    const txns = results.map((tx) => translateToLedgerTx(tx))

    const reconciliationTxn = txns.find((txn) => isOnChainFeeReconciliationTxn(txn))
    return reconciliationTxn !== undefined
  } catch (err) {
    return new UnknownLedgerError(err)
  }
}
