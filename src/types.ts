import { Logger as PinoLogger } from "pino"
import { User } from "./schema"

export type Side = "buy" | "sell"
export type Currency = "USD" | "BTC"

export type ISuccess = boolean

export type Logger = PinoLogger

export type Primitive = string | boolean | number

export type WalletConstructorArgs = {
  // FIXME: Add a type for user here.
  user: unknown
  logger: Logger
}

export type UserWalletConstructorArgs = WalletConstructorArgs & {
  config: UserWalletConfig
}

export interface ITransactionLimits {
  config
  level: number
  onUsLimit: () => number
  withdrawalLimit: () => number
  oldEnoughForWithdrawalLimit: () => number
}

export type UserWalletConfig = {
  dustThreshold: number
  limits: ITransactionLimits
  name: string
}

export type SpecterWalletConfig = {
  lndHoldingBase: number
  ratioTargetDeposit: number
  ratioTargetWithdraw: number
  minOnchain: number
  onchainWallet: string
}

export type SpecterWalletConstructorArgs = {
  config: SpecterWalletConfig
  logger: Logger
}

// Lightning

export interface IAddInvoiceRequest {
  value: number
  memo: string | undefined
  selfGenerated?: boolean
}

export interface IAddBTCInvoiceRequest {
  value: number | undefined
  memo?: string | undefined
  selfGenerated?: boolean
}

export interface IAddUSDInvoiceRequest {
  value: number
  memo: string | undefined
}

export type IAddInvoiceResponse = {
  request: string
}

export type ChainType = "lightning" | "onchain"

// TODO:
// refactor lightning/onchain and payment/receipt/onus
// to 2 different variables.
// also log have renamed "paid-invoice" --> "receipt"

export type TransactionType =
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

export type Levels = number[]

export interface IOnChainPayment {
  address: string
  amount: number // sats
  memo?: string
  sendAll?: boolean
}

export interface ITransaction {
  created_at: number // unix
  amount: number
  sat: number
  usd: number
  description: string
  type: TransactionType
  hash?: string
  fee: number
  feeUsd: number
  username: string
  // destination?: string
  pending: boolean
  id: string
  currency: string
  addresses?: string[]
}

export interface IFeeRequest {
  amount?: number
  invoice?: string
  username?: string
}

export interface IPaymentRequest {
  username?: string
  amount?: number
  invoice?: string
  memo?: string
  isReward?: boolean
}

export type IPayInvoice = {
  invoice: string
}

export interface IQuoteRequest {
  side: Side
  satAmount?: number // sell
  invoice?: string // buy
}

export interface IDataNotification {
  type: TransactionType
  amount: number
  hash?: string
  txid?: string // FIXME in mongodb, there is no differenciation between hash and txid?
}

export interface IPaymentNotification {
  amount: number
  type: string
  user: typeof User
  logger: Logger
  hash?: string
  txid?: string
}

export interface INotification {
  user: typeof User
  title: string
  data?: IDataNotification
  body?: string
  logger: Logger
}

// TODO: Add types for payer, payee and metadata
export type IAddTransactionOnUsPayment = {
  description: string
  sats: number
  metadata: Record<string, unknown>
  payerUser: typeof User
  payeeUser: typeof User
  memoPayer?: string
  shareMemoWithPayee?: boolean
}
