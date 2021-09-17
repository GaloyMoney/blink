declare const hashedApiKeySymbol: unique symbol
type HashedKey = string & { [hashedApiKeySymbol]: never }

type ApiKey = {
  label: string
  key: string
  secret: string
  expireAt: Date
}

type AccountApiKey = {
  accountId: AccountId
  label: string
  hashedKey: HashedKey
  expireAt: Date
}

interface IAccountApiKeysRepository {
  findByHashedKey(hashedKey: HashedKey): Promise<AccountApiKey | RepositoryError>
  listByAccountId(accountId: AccountId): Promise<AccountApiKey[] | RepositoryError>
  persistNew(
    accountId: AccountId,
    label: string,
    hashedKey: HashedKey,
    expireAt: Date,
  ): Promise<AccountApiKey | RepositoryError>
  disableByLabel(accountId: AccountId, label: string): Promise<void | RepositoryError>
}
