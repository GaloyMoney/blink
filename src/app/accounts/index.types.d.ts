type AddApiKeyForAccountArgs = {
  accountId: AccountId
  label?: string
  expireAt: Date
}

type DisableApiKeyArgs = {
  accountId: AccountId
  label: string
}
