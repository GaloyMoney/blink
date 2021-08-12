// globally used types
type Logger = import("pino").Logger

type Currency = "USD" | "BTC"

type Primitive = string | boolean | number

// configs & constructors
// TODO: clean up this section when "constructor typing" work is
//       being done

type GenericLimits = {
  oldEnoughForWithdrawalHours: number
  oldEnoughForWithdrawalMicroseconds: number
}

type FeeRates = {
  depositFeeVariable: number
  depositFeeFixed: number
  withdrawFeeVariable: number
  withdrawFeeFixed: number
}

type UserLimitsArgs = { level: number; limitsConfig? }

interface IUserLimits {
  onUsLimit: number
  withdrawalLimit: number
}

interface ITransactionLimits extends IUserLimits {
  oldEnoughForWithdrawalMicroseconds: number
  oldEnoughForWithdrawalHours: number
}

interface IRateLimits {
  points: number
  duration: number
  blockDuration: number
}

type onChainWalletConfig = {
  dustThreshold: number
}

type UserWalletConfig = {
  dustThreshold: number
  onchainMinConfirmations: number
  limits: ITransactionLimits
  name: string
}

type WalletConstructorArgs = {
  user: UserType
  logger: Logger
}

type UserWalletConstructorArgs = WalletConstructorArgs & {
  config: UserWalletConfig
}

type IpConfig = {
  ipRecordingEnabled: boolean
  proxyCheckingEnabled: boolean
  blacklistedIPTypes: string[]
  blacklistedIPs: string[]
}

type HelmetConfig = {
  disableContentPolicy: boolean
}

// Currently unused types

interface IAddBTCInvoiceRequest {
  value: number | undefined
  memo?: string | undefined
  selfGenerated?: boolean
}

interface IAddUSDInvoiceRequest {
  value: number
  memo: string | undefined
}

type IAddInvoiceResponse = {
  request: string
}

type Levels = number[]

type IPayInvoice = {
  invoice: string
}

type Side = "buy" | "sell"

interface IQuoteRequest {
  side: Side
  satAmount?: number // sell
  invoice?: string // buy
}
