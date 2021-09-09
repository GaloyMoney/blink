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

declare const businessMapTitleSymbol: unique symbol
type BusinessMapTitle = string & { [businessMapTitleSymbol]: never }

type Coordinates = {
  longitude: number
  latitude: number
}

type BusinessMapInfo = {
  title: BusinessMapTitle
  coordinates: Coordinates
}

type BusinessMapMarker = {
  walletName: WalletName
  mapInfo: BusinessMapInfo
}

interface IAccountsRepository {
  findById(accountId: AccountId): Promise<Account | RepositoryError>
  listByUserId(userId: UserId): Promise<Account[] | RepositoryError>
  findByWalletName(walletName: WalletName): Promise<Account | RepositoryError>
  listBusinessesForMap(): Promise<BusinessMapMarker[] | RepositoryError>
}
