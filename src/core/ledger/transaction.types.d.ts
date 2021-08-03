// TODO: Add types for payer, payee and metadata
type IAddTransactionOnUsPayment = {
  description: string
  sats: number
  metadata: Record<string, unknown>
  payerUser: UserType
  payeeUser: UserType
  memoFromPayer?: string
  shareMemoWithPayee?: boolean
  lastPrice: number
}
