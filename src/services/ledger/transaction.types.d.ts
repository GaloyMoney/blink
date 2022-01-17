// TODO: Add types for payer, payee and metadata
type IAddTransactionOnUsPayment = {
  description: string
  sats: number
  metadata: Record<string, unknown>
  payerUser: UserRecord // FIXME: move it to User
  payeeUser: UserRecord // FIXME: move it to User
  memoPayer?: string
  shareMemoWithPayee?: boolean
  lastPrice: number
}
