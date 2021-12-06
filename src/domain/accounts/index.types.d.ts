type AccountError = import("./errors").AccountError

declare const currencyRatioSymbol: unique symbol
type CurrencyRatio = number & { [currencyRatioSymbol]: never }

type AccountLevel =
  typeof import("./index").AccountLevel[keyof typeof import("./index").AccountLevel]

type AccountStatus =
  typeof import("./index").AccountStatus[keyof typeof import("./index").AccountStatus]

type Account = {
  readonly id: AccountId
  readonly createdAt: Date
  readonly username: Username
  readonly defaultWalletId: WalletPublicId
  readonly ownerId: UserId
  level: AccountLevel
  status: AccountStatus
  readonly walletIds: WalletId[]
  title: BusinessMapTitle
  coordinates: Coordinates
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
  username: Username
  mapInfo: BusinessMapInfo
}

type LimitsChecker = {
  checkTwoFA({
    amount,
    walletVolume,
  }: {
    amount: Satoshis
    walletVolume: TxVolume
  }): true | LimitsExceededError
  checkIntraledger({
    amount,
    walletVolume,
  }: {
    amount: Satoshis
    walletVolume: TxVolume
  }): true | LimitsExceededError
  checkWithdrawal({
    amount,
    walletVolume,
  }: {
    amount: Satoshis
    walletVolume: TxVolume
  }): true | LimitsExceededError
}

interface IAccountsRepository {
  findById(accountId: AccountId): Promise<Account | RepositoryError>
  listByUserId(userId: UserId): Promise<Account[] | RepositoryError>
  findByWalletId(walletId: WalletId): Promise<Account | RepositoryError>
  findByWalletPublicId(walletPublicId: WalletPublicId): Promise<Account | RepositoryError>
  findByUsername(username: Username): Promise<Account | RepositoryError>
  listBusinessesForMap(): Promise<BusinessMapMarker[] | RepositoryError>
  update(account: Account): Promise<Account | RepositoryError>
}
