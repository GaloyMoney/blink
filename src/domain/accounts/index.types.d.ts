type AccountLevel =
  typeof import("./index").AccountLevel[keyof typeof import("./index").AccountLevel]

type AccountStatus =
  typeof import("./index").AccountStatus[keyof typeof import("./index").AccountStatus]

type Account = {
  id: AccountId
  level: AccountLevel
  status: AccountStatus
  walletIds: WalletId[]
}

interface IAccountsRepository {
  findById(accountId: AccountId): Promise<Account | RepositoryError>
}
