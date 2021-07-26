type Logger = import("pino").Logger
type UserType = typeof import("./schema").User

type Side = "buy" | "sell"
type Currency = "USD" | "BTC"

type ISuccess = boolean

type Primitive = string | boolean | number

type WalletConstructorArgs = {
  // FIXME: Add a type for user here.
  user: unknown
  logger: Logger
}

type UserWalletConstructorArgs = WalletConstructorArgs & {
  config: UserWalletConfig
}

interface ITransactionLimits {
  config
  level: number
  onUsLimit: () => number
  withdrawalLimit: () => number
  oldEnoughForWithdrawalLimit: () => number
}

type UserWalletConfig = {
  dustThreshold: number
  limits: ITransactionLimits
  name: string
}

type SpecterWalletConfig = {
  lndHoldingBase: number
  ratioTargetDeposit: number
  ratioTargetWithdraw: number
  minOnchain: number
  onchainWallet: string
}

type SpecterWalletConstructorArgs = {
  config: SpecterWalletConfig
  logger: Logger
}

// Lightning

interface IAddInvoiceRequest {
  value: number
  memo: string | undefined
  selfGenerated?: boolean
}

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

type ChainType = "lightning" | "onchain"

// TODO:
// refactor lightning/onchain and payment/receipt/onus
// to 2 different variables.
// also log have renamed "paid-invoice" --> "receipt"

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

type Levels = number[]

interface IOnChainPayment {
  address: string
  amount: number // sats
  memo?: string
  sendAll?: boolean
}

interface ITransaction {
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

interface IFeeRequest {
  amount?: number
  invoice?: string
  username?: string
}

interface IPaymentRequest {
  username?: string
  amount?: number
  invoice?: string
  memo?: string
  isReward?: boolean
}

type IPayInvoice = {
  invoice: string
}

interface IQuoteRequest {
  side: Side
  satAmount?: number // sell
  invoice?: string // buy
}

interface IDataNotification {
  type: TransactionType
  amount: number
  hash?: string
  txid?: string // FIXME in mongodb, there is no differenciation between hash and txid?
}

interface IPaymentNotification {
  amount: number
  type: string
  user: UserType
  logger: Logger
  hash?: string
  txid?: string
}

interface INotification {
  user: UserType
  title: string
  data?: IDataNotification
  body?: string
  logger: Logger
}

// TODO: Add types for payer, payee and metadata
type IAddTransactionOnUsPayment = {
  description: string
  sats: number
  metadata: Record<string, unknown>
  payerUser: UserType
  payeeUser: UserType
  memoPayer?: string
  shareMemoWithPayee?: boolean
}
