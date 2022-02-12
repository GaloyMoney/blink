type AccountError = import("./errors").AccountError

type CurrencyRatio = number & { readonly brand: unique symbol }
type AccountLevel =
  typeof import("./index").AccountLevel[keyof typeof import("./index").AccountLevel]

type AccountStatus =
  typeof import("./index").AccountStatus[keyof typeof import("./index").AccountStatus]

type DepositFeeRatio = number & { readonly brand: unique symbol }

type ContactAlias = string & { readonly brand: unique symbol }

type AccountLimitsArgs = {
  level: AccountLevel
  accountLimits?: {
    intraLedger: {
      level: {
        [l: number]: UsdCents
      }
    }
    withdrawal: {
      level: {
        [l: number]: UsdCents
      }
    }
  }
}

interface IAccountLimits {
  intraLedgerLimit: UsdCents
  withdrawalLimit: UsdCents
}

type AccountContact = {
  readonly id: Username
  readonly username: Username
  alias: ContactAlias
  transactionsCount: number
}

type Account = {
  readonly id: AccountId
  readonly createdAt: Date
  username: Username
  defaultWalletId: WalletId
  readonly ownerId: UserId
  readonly depositFeeRatio: DepositFeeRatio
  withdrawFee: Satoshis
  level: AccountLevel
  status: AccountStatus
  title: BusinessMapTitle
  coordinates: Coordinates
  readonly contacts: AccountContact[]
}

type WithdrawFeeRange = {
  min: Satoshis
  max: Satoshis
}

type BusinessMapTitle = string & { readonly brand: unique symbol }
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

type LimiterCheckInputs = {
  amount: UsdCents
  walletVolume: TxBaseVolume
}

type LimitsCheckerFn = (args: LimiterCheckInputs) => true | LimitsExceededError

type LimitsChecker = {
  checkTwoFA: LimitsCheckerFn
  checkIntraledger: LimitsCheckerFn
  checkWithdrawal: LimitsCheckerFn
}

interface IAccountsRepository {
  listUnlockedAccounts(): Promise<Account[] | RepositoryError>
  findById(accountId: AccountId): Promise<Account | RepositoryError>
  findByUserId(userId: UserId): Promise<Account | RepositoryError>
  findByUsername(username: Username): Promise<Account | RepositoryError>
  listBusinessesForMap(): Promise<BusinessMapMarker[] | RepositoryError>
  update(account: Account): Promise<Account | RepositoryError>
}

type TestAccount = {
  phone: PhoneNumber
  code: PhoneCode
  username: Username | undefined
  role: string | undefined // FIXME
}

type TestAccountsChecker = (testAccounts: TestAccount[]) => {
  isPhoneValid: (phone: PhoneNumber) => boolean
  isPhoneAndCodeValid: ({
    code,
    phone,
  }: {
    code: PhoneCode
    phone: PhoneNumber
  }) => boolean
}
