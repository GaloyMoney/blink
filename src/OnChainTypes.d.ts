type ISuccess = boolean

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

interface IOnChainPayment {
  address: string
  amount: number // sats
  memo?: string
  sendAll?: boolean
}
