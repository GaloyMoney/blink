import { Order } from "ccxt"
import { Result } from "./Result"

export enum TradeCurrency {
  BTC = "BTC",
  USD = "USD",
}

export enum TradeSide {
  Buy = "buy",
  Sell = "sell",
  NoTrade = "",
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
