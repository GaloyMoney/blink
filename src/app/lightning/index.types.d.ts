type LnSendPaymentResult =
  typeof import("./index").LnSendPaymentResult[keyof typeof import("./index").LnSendPaymentResult]

type Balances = {
  BTC: number
  USD: number
  total_in_BTC: number
  total_in_USD: number
}
