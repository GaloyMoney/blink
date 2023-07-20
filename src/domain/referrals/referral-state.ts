import { LedgerTransactionType } from "@domain/ledger"

import { ReferralError } from "./errors"

export const createReferralState = (): ReferralState => {
  const orderedReferrals: Referral[] = []
  const referralForAccount: Map<AccountId, Referral> = new Map()

  const accountHasBeenReferred = (accountId: AccountId) =>
    referralForAccount.has(accountId)
  const addReferral = (referral: Referral) => {
    orderedReferrals.push(referral)
    referralForAccount.set(referral.referredAccount, referral)
  }

  return {
    mostRecentTransactionTime: undefined,
    orderedReferrals: [],
    accountHasBeenReferred,
    addReferral,
    referralForAccount,
  }
}

export const isTransactionAReferral = ({
  referralState,
  transaction,
  getAccountIdForWalletId,
}: IsTransactionAReferralProps) => {
  if (
    referralState.mostRecentTransactionTime !== undefined &&
    transaction.timestamp > referralState.mostRecentTransactionTime
  ) {
    return new ReferralError()
  }

  if (!(transaction.type in referringTxTypes)) {
    return false
  }

  if (transaction.recipientWalletId === undefined || transaction.walletId === undefined) {
    return new ReferralError()
  }

  const accountId = getAccountIdForWalletId(transaction.recipientWalletId)

  if (referralState.accountHasBeenReferred(accountId)) {
    return false
  }

  return true
}

const referringTxTypes: LedgerTransactionType[] = [
  LedgerTransactionType.OnchainIntraLedger,
  LedgerTransactionType.LnIntraLedger,
  LedgerTransactionType.IntraLedger,
]

export const createReferral = ({
  referralState,
  referringTransaction,
  getAccountForWalletIdFn,
}: CreateReferralProps): Referral | ReferralError => {
  // By splitting up checking for a referral and creating a referral, duplicate validation is required
  if (
    referringTransaction.recipientWalletId === undefined ||
    referringTransaction.walletId === undefined
  ) {
    return new ReferralError()
  }

  const referringAccount = getAccountForWalletIdFn(referringTransaction.walletId)
  const referringAccountsReferral = referralState.referralForAccount.get(referringAccount)
  const referringReferringAccount =
    referringAccountsReferral && referringAccountsReferral.referringAccount
  const referredAccount = getAccountForWalletIdFn(referringTransaction.recipientWalletId)

  return {
    referredAccount,
    referringAccount,
    referringReferringAccount,
    referringTxId: referringTransaction.id,
    timestamp: referringTransaction.timestamp,
  }
}
