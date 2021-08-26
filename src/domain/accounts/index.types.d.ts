declare const currencyRatioSymbol: unique symbol
type CurrencyRatio = number & { [currencyRatioSymbol]: never }

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

type Currencies = {
  id: Currency
  ratio: CurrencyRatio
}[]

interface IAccountsRepository {
  findById(accountId: AccountId): Promise<Account | RepositoryError>
}
