interface LnPaymentType {
  id: string
  createdAt: Date
  status: string
  paymentHash: string
  paymentRequest: string
  sentFromPubkey: string
  milliSatsAmount: string
  roundedUpAmount: number
  confirmedDetails: LnPaymentConfirmedDetails | undefined
  attempts: LnPaymentAttempt[]
  isCompleteRecord: boolean
}
