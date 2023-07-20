interface PossibleWelcomeTransaction {
  timestamp: Date
  id: LedgerTransactionId
  recipientAccountId?: AccountId
  senderAccountId?: AccountId
  type: LedgerTransactionType
}

type Welcome = {
  welcomerAccountId: AccountId
  welcomeeAccountId: AccountId
  welcomeTxId: LedgerTransactionId
  timestamp: Date
}

type WelcomeProfile = {
  accountId: AccountId
  allTimeCount: number
  thisMonthCount: number
  allTimeOuterCircleCount: number
  thisMonthOuterCircleCount: number
}

type IWelcomeProfileRepository = {
  save: (welcomeProfiles: WelcomeProfile[]) => void
  getLeaders: () => WelcomeProfile[]
}
