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

type AccountContact = {
  readonly id: Username
  readonly username: Username
  alias: ContactAlias
  transactionsCount: number
}

type AccountStatusHistory = Array<{
  status: AccountStatus
  updatedAt?: Date
  updatedByUserId?: UserId
  comment?: string
}>

type Account = {
  readonly id: AccountId
  readonly createdAt: Date
  username: Username
  defaultWalletId: WalletId
  readonly ownerId: UserId
  readonly depositFeeRatio: DepositFeeRatio
  withdrawFee: Satoshis // TODO: make it optional. only save when not default value from yaml
  level: AccountLevel
  status: AccountStatus
  statusHistory: AccountStatusHistory
  title: BusinessMapTitle
  coordinates: Coordinates
  contactEnabled: boolean
  readonly contacts: AccountContact[]
  readonly isEditor: boolean
  role?: string
  readonly quizQuestions: UserQuizQuestion[]
  kratosUserId?: KratosUserId // TODO: remove ? after initial kratos migration
}

type QuizQuestionId = string & { readonly brand: unique symbol }

type QuizQuestion = {
  readonly id: QuizQuestionId
  readonly earnAmount: Satoshis
}

type UserQuizQuestion = {
  readonly question: QuizQuestion
  completed: boolean
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
  checkIntraledger: LimitsCheckerFn
  checkWithdrawal: LimitsCheckerFn
}

type NewLimiterCheckInputs = {
  amount: UsdPaymentAmount
  walletVolume: TxBaseVolumeAmount<WalletCurrency>
}

type NewLimitsCheckerFn = (
  args: NewLimiterCheckInputs,
) => Promise<true | LimitsExceededError>

type AccountLimitsChecker = {
  checkIntraledger: NewLimitsCheckerFn
  checkWithdrawal: NewLimitsCheckerFn
  checkTradeIntraAccount: NewLimitsCheckerFn
}

type TwoFALimitsChecker = {
  checkTwoFA: NewLimitsCheckerFn
}

type AccountValidator = {
  validateWalletForAccount(wallet: Wallet): true | ValidationError
}

type NewAccountWithEmailIdentifier = {
  kratosUserId: KratosUserId
  phone?: undefined
  phoneMetadata?: undefined
}

type NewAccountWithPhoneIdentifier = {
  kratosUserId: KratosUserId
  phone: PhoneNumber
  phoneMetadata?: PhoneMetadata
}

type NewAccount = NewAccountWithEmailIdentifier | NewAccountWithPhoneIdentifier

interface IAccountsRepository {
  listUnlockedAccounts(): Promise<Account[] | RepositoryError>
  findById(accountId: AccountId): Promise<Account | RepositoryError>
  findByUserId(userId: UserId): Promise<Account | RepositoryError>

  findByKratosUserId(kratosUserId: KratosUserId): Promise<Account | RepositoryError>
  persistNew({ kratosUserId }: NewAccount): Promise<Account | RepositoryError>

  persistNew({
    kratosUserId,
    phone,
    phoneMetadata,
  }: NewAccount): Promise<Account | RepositoryError>

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

type TwoFALimits = {
  threshold: UsdCents
}

type FeesConfig = {
  depositFeeVariable: number
  depositFeeFixed: CurrencyBaseAmount
  withdrawMethod: WithdrawalFeePriceMethod
  withdrawRatio: number
  withdrawThreshold: Satoshis
  withdrawDaysLookback: Days
  withdrawDefaultMin: Satoshis
}
