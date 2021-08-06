// globally used types
type Logger = import("pino").Logger

type Currency = "USD" | "BTC"

type Primitive = string | boolean | number

// configs & constructors
// TODO: clean up this section when "constructor typing" work is
//       being done
interface ITransactionLimits {
  config
  level: number
  onUsLimit: () => number
  withdrawalLimit: () => number
  oldEnoughForWithdrawalLimit: () => number
}

interface IRateLimits {
  points: number
  duration: number
  blockDuration: number
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
