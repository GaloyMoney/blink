import { ITransaction } from "./types"

export interface Balances {
  BTC: number,
  USD: number,
  total_in_BTC: number,
  total_in_USD: number,
}

export interface IWallet {
  getBalances(): Promise<Balances>
  getTransactions(): any // TODO
  getInfo(): Promise<Record<string, unknown>>
}

export interface ILightningWallet extends IWallet {
  payInvoice(): Promise<any> // TODO
  addInvoice(): Promise<any> // TODO
}

export interface FiatTransaction {
  amount: number,
  date: number,
  icon: string,
  name: string,
  onchain_tx?: string, // should be HEX?
}

export interface Auth {
  macaroon: string,
  cert: string,
  socket: string,
}
