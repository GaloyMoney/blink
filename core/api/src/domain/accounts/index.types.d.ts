type AccountError = import("./errors").AccountError

type CurrencyRatio = number & { readonly brand: unique symbol }
type AccountLevel =
  (typeof import("./index").AccountLevel)[keyof typeof import("./index").AccountLevel]

type AccountStatus =
  (typeof import("./index").AccountStatus)[keyof typeof import("./index").AccountStatus]

type AccountLimitsRange =
  (typeof import("./index").AccountLimitsRange)[keyof typeof import("./index").AccountLimitsRange]

type AccountLimitsType =
  (typeof import("./index").AccountLimitsType)[keyof typeof import("./index").AccountLimitsType]

type DepositFeeRatioAsBasisPoints = bigint & { readonly brand: unique symbol }

type ContactAlias = string & { readonly brand: unique symbol }

type AccountLimitsArgs = {
  level: AccountLevel
  accountLimits?: {
    intraLedger: {
      level: {
        [l: number]: number
      }
    }
    withdrawal: {
      level: {
        [l: number]: number
      }
    }
    tradeIntraAccount: {
      level: {
        [l: number]: number
      }
    }
  }
}

interface IAccountLimits {
  intraLedgerLimit: UsdCents
  withdrawalLimit: UsdCents
  tradeIntraAccountLimit: UsdCents
}

type IAccountLimitAmounts = { [key in keyof IAccountLimits]: UsdPaymentAmount }

interface IAccountTxVolumeLimitChecker {
  checkIntraledger: (args: {
    amount: UsdPaymentAmount
    volumeRemaining: UsdPaymentAmount
  }) => Promise<true | IntraledgerLimitsExceededError>

  checkWithdrawal: (args: {
    amount: UsdPaymentAmount
    volumeRemaining: UsdPaymentAmount
  }) => Promise<true | WithdrawalLimitsExceededError>

  checkTradeIntraAccount: (args: {
    amount: UsdPaymentAmount
    volumeRemaining: UsdPaymentAmount
  }) => Promise<true | TradeIntraAccountLimitsExceededError>
}

interface IAccountTxVolumeRemaining {
  intraLedger: (args: {
    priceRatio: WalletPriceRatio
    walletVolumes: TxBaseVolumeAmount<WalletCurrency>[]
  }) => Promise<UsdPaymentAmount | ValidationError>

  withdrawal: (args: {
    priceRatio: WalletPriceRatio
    walletVolumes: TxBaseVolumeAmount<WalletCurrency>[]
  }) => Promise<UsdPaymentAmount | ValidationError>

  tradeIntraAccount: (args: {
    priceRatio: WalletPriceRatio
    walletVolumes: TxBaseVolumeAmount<WalletCurrency>[]
  }) => Promise<UsdPaymentAmount | ValidationError>
}

type AccountContact = {
  readonly id: Username
  readonly username: Username
  alias: ContactAlias
  transactionsCount: number
}

type AccountStatusHistory = Array<{
  status: AccountStatus
  updatedAt?: Date
  updatedByPrivilegedClientId?: PrivilegedClientId
  comment?: string
}>

type Account = {
  readonly id: AccountId
  readonly uuid: AccountUuid
  readonly createdAt: Date
  username: Username
  defaultWalletId: WalletId
  withdrawFee: Satoshis // TODO: make it optional. only save when not default value from yaml
  level: AccountLevel
  status: AccountStatus
  statusHistory: AccountStatusHistory
  title: BusinessMapTitle | null
  coordinates: Coordinates | null
  contactEnabled: boolean
  readonly contacts: AccountContact[]
  readonly quizQuestions: UserQuizQuestion[] // deprecated
  readonly quiz: Quiz[]
  notificationSettings: NotificationSettings
  kratosUserId: UserId
  displayCurrency: DisplayCurrency
  // temp
  role?: string
}

// deprecated
type QuizQuestion = {
  readonly id: QuizQuestionId
  readonly earnAmount: Satoshis
}

// deprecated
type UserQuizQuestion = {
  readonly question: QuizQuestion
  completed: boolean
}

type Quiz = {
  readonly id: QuizQuestionId
  readonly amount: Satoshis
  readonly completed: boolean
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

type AccountValidator = {
  validateWalletForAccount(wallet: Wallet): true | ValidationError
}

interface IAccountsRepository {
  listUnlockedAccounts(): AsyncGenerator<Account> | RepositoryError
  findById(accountId: AccountId): Promise<Account | RepositoryError>
  findByUserId(kratosUserId: UserId): Promise<Account | RepositoryError>
  findByUuid(accountUuid: AccountUuid): Promise<Account | RepositoryError>

  persistNew(kratosUserId: UserId): Promise<Account | RepositoryError>

  findByUsername(username: Username): Promise<Account | RepositoryError>
  listBusinessesForMap(): Promise<BusinessMapMarker[] | RepositoryError>
  update(account: Account): Promise<Account | RepositoryError>
}

type AdminRole = "dealer" | "funder" | "bankowner"
type AdminAccount = {
  role: AdminRole
  phone: PhoneNumber
}

type TestAccount = {
  phone: PhoneNumber
  code: PhoneCode
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

type FeesConfig = {
  depositRatioAsBasisPoints: DepositFeeRatioAsBasisPoints
  depositThreshold: BtcPaymentAmount
  depositDefaultMin: BtcPaymentAmount
  withdrawMethod: WithdrawalFeePriceMethod
  withdrawRatioAsBasisPoints: bigint
  withdrawThreshold: Satoshis
  withdrawDaysLookback: Days
  withdrawDefaultMin: Satoshis
}
