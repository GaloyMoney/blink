type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

type Logger = import("pino").Logger
type LogFn = import("pino").LogFn

type Currency = "USD" | "BTC"

type Primitive = string | boolean | number

type CustomErrorData = {
  message?: string
  logger: Logger
  level?: "fatal" | "error" | "warn" | "info" | "debug" | "trace" | "silent"
  forwardToClient?: boolean
  [key: string]: unknown
}

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

type IpConfig = {
  ipRecordingEnabled: boolean
  proxyCheckingEnabled: boolean
  blacklistedIPTypes: string[]
  blacklistedIPs: string[]
}

type HelmetConfig = {
  disableContentPolicy: boolean
}

type TwoFAConfig = {
  threshold: number
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
