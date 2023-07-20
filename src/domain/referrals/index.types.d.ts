type Referral = {
  referringReferringAccount: AccountId | undefined
  referringAccount: AccountId
  referredAccount: AccountId
  referringTxId: LedgerTransactionId
  timestamp: Date
}

// Should this be more functional?
type ReferralState = {
  mostRecentTransactionTime: Date | undefined
  accountHasBeenReferred: (accountId: AccountId) => boolean
  orderedReferrals: Referral[]
  addReferral: (referral: Referral) => void
  referralForAccount: Map<AccountId, Referral>
}

type GetAccountIdForWalletIdFn = (walletId: WalletId) => AccountId

type IsTransactionAReferralProps = {
  referralState: ReferralState
  transaction: LedgerTransaction<WalletCurrency>
  getAccountIdForWalletId: GetAccountIdForWalletIdFn
}

type ReferralProfile = {
  accountId: AccountId
  thisMonthReferralCount: number
  thisMonthOuterReferralCount: number
  totalReferralCount: number
  totalOuterReferralCount: number
}

// TODO name change in parallel with ReferralState
type ReferralProfileState = {
  timeOfSnapshot: Date | undefined // This could technically be a private member
  updateTime: (currentTime: Date) => void
  consumeReferral: (referral: Referral) => void
  getReferralProfileForAccount: (accountId: AccountId) => ReferralProfile
}

type CreateReferralProfileProps = {
  accountId: AccountId
}

type CreateReferralProps = {
  referringTransaction: LedgerTransaction<WalletCurrency>
  referralState: ReferralState
  getAccountForWalletIdFn: GetAccountIdForWalletIdFn
}
