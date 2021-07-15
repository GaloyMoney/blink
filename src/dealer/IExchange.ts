import { Order } from "ccxt"
import { Result } from "./Result"

export enum Currency {
  BTC = "BTC",
  USD = "USD",
}

export enum TradeSide {
  Buy = "buy",
  Sell = "sell",
  NoTrade = "",
}

export interface IOrder {
  tradeSide: TradeSide
  quantity: number
  currency: Currency
}

export enum FundTransferSide {
  Withdraw = "withdraw",
  Deposit = "deposit",
  NoTransfer = "",
}

export interface IFundTransfer {
  transferSide: FundTransferSide
  quantity: number
  currency: Currency
}

export enum OrderStatus {
  Open = "open",
  Closed = "closed",
  Canceled = "canceled",
}
