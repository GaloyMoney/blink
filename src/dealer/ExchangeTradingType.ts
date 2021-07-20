export enum TradeCurrency {
  BTC = "BTC",
  USD = "USD",
}

export enum TradeSide {
  Buy = "buy",
  Sell = "sell",
  NoTrade = "",
}

export enum TradeType {
  Market = "market",
  Limit = "limit",
}

export interface TradeOrder {
  tradeSide: TradeSide
  quantity: number
  currency: TradeCurrency
}

export enum FundTransferSide {
  Withdraw = "withdraw",
  Deposit = "deposit",
  NoTransfer = "",
}

export enum FundTransferStatus {
  Ok = "ok",
  Pending = "pending",
  Failed = "failed",
  Canceled = "canceled",
  Requested = "requested",
}

export interface FundTransfer {
  transferSide: FundTransferSide
  quantity: number
  currency: TradeCurrency
}

export enum OrderStatus {
  Open = "open",
  Closed = "closed",
  Canceled = "canceled",
}

export enum SupportedChain {
  BTC_Bitcoin = "BTC-Bitcoin",
  BTC_Lightning = "BTC-Lightning",
}

export interface FetchDepositAddressResult {
  originalResponseAsIs // the original JSON response from the exchange as is
  chain: SupportedChain
  currency: TradeCurrency
  address: string
}

export interface WithdrawParameters {
  currency: TradeCurrency
  quantity: number
  address: string
}

export interface WithdrawResult {
  originalResponseAsIs
  status: FundTransferStatus
}

export interface CreateOrderParameters {
  type: TradeType
  side: TradeSide
  quantity: number
}

export interface CreateOrderResult {
  originalResponseAsIs
  id: string
}

export interface FetchOrderResult {
  originalResponseAsIs
  status: OrderStatus
}

export interface GetAccountAndPositionRiskResult {
  originalResponseAsIs
  lastBtcPriceInUsd: number
  leverageRatio: number
  collateralInUsd: number
  exposureInUsd: number
  totalAccountValueInUsd: number
}

export interface GetInstrumentDetailsResult {
  originalResponseAsIs
  minimumOrderSizeInContract: number
  contractFaceValue: number
}

export enum ApiError {
  NOT_IMPLEMENTED = "Not Implemented",
  UNSUPPORTED_CHAIN = "Unsupported Chain",
  UNSUPPORTED_CURRENCY = "Unsupported Currency",
  UNSUPPORTED_ADDRESS = "Unsupported Address",
  UNSUPPORTED_API_RESPONSE = "Unsupported API response",
  MISSING_PARAMETERS = "Missing Parameters",
  NON_POSITIVE_QUANTITY = "Non Positive Quantity",
  INVALID_TRADE_SIDE = "Invalid Trade Side",
  MISSING_ORDER_ID = "Missing Order Id",
  NON_POSITIVE_PRICE = "Non Positive Price",
  NON_POSITIVE_NOTIONAL = "Non Positive Notional",
  NON_POSITIVE_MARGIN = "Non Positive Margin",
  MISSING_ACCOUNT_VALUE = "Missing Account Value",
  NON_POSITIVE_ACCOUNT_VALUE = "Non Positive Account Value",
}
