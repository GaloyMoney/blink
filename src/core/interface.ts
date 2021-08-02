export interface Balances {
  BTC: number
  USD: number
  total_in_BTC: number
  total_in_USD: number
}

export interface FiatTransaction {
  amount: number
  date: number
  icon: string
  name: string
  onchain_tx?: string // should be HEX?
}

export interface Auth {
  macaroon: string
  cert: string
  socket: string
}
