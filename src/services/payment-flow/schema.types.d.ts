type PaymentFlowStateRecord = {
  _id: ObjectId
} & PaymentFlowStateRecordPartial

type PaymentFlowStateRecordPartial = XOR<
  { paymentHash: string },
  { intraLedgerHash: string }
> & {
  senderWalletId: string
  senderWalletCurrency: string
  settlementMethod: string
  paymentInitiationMethod: string
  createdAt: Date
  paymentSentAndPending: boolean
  descriptionFromInvoice: string
  skipProbeForDestination: boolean

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

type PaymentFlowStateRecordIndex = XOR<
  { paymentHash: string },
  { intraLedgerHash: string }
> & {
  senderWalletId: string
  inputAmount: number
}
