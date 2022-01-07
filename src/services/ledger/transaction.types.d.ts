// TODO: Add types for payer, payee and metadata
type IAddTransactionOnUsPayment = {
  description: string
  sats: number
  metadata: Record<string, unknown>
  payerUser: UserType // FIXME: move it to User
  payeeUser: UserType // FIXME: move it to User
  memoPayer?: string
  shareMemoWithPayee?: boolean
  lastPrice: number
}
