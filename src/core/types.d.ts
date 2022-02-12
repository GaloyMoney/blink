// globally used types
type Logger = import("pino").Logger

type Primitive = string | boolean | number

// configs & constructors
// TODO: clean up this section when "constructor typing" work is
//       being done

type TwoFALimits = {
  threshold: UsdCents
}

type FeeRates = {
  depositFeeVariable: number
  depositFeeFixed: CurrencyBaseAmount
  withdrawFeeVariable: number
  withdrawFeeFixed: CurrencyBaseAmount
}

type onChainWalletConfig = {
  dustThreshold: number
}

type IpConfig = {
  ipRecordingEnabled: boolean
  proxyCheckingEnabled: boolean
}

type ApolloConfig = {
  playground: boolean
  playgroundUrl: string
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

type TransactionType =
  | "payment"
  | "paid-invoice"
  | "on_us"
  | "onchain_receipt"
  | "onchain_payment"
  | "onchain_on_us"
  | "exchange_rebalance"
  | "fee"
  | "escrow"
  | "deposit_fee"
  | "routing_fee"
  | "onchain_receipt_pending" // only for notification, not persistent in mongodb
