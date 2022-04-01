type PaymentFlowStateRecord = {
  _id: ObjectId
} & PaymentFlowStateRecordPartial

type PaymentFlowStateRecordPartial = {
  senderWalletId: string
  senderWalletCurrency: string
  settlementMethod: string
  paymentInitiationMethod: string
  paymentHash: string
  descriptionFromInvoice: string

  btcPaymentAmount: number
  usdPaymentAmount: number
  inputAmount: number

  btcProtocolFee: number
  usdProtocolFee: number

  recipientWalletId?: string
  recipientWalletCurrency?: string
  recipientPubkey?: string
  recipientUsername?: string

  outgoingNodePubkey?: string
  cachedRoute?: RawRoute
}
