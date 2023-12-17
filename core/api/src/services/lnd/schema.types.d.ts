interface LnPaymentType {
  id: string
  createdAt: Date
  status: string
  paymentHash: string
  paymentRequest: string
  sentFromPubkey: string
  milliSatsAmount: number
  roundedUpAmount: number
  confirmedDetails: LnPaymentConfirmedDetails | undefined
  attempts: LnPaymentAttempt[]
  isCompleteRecord: boolean
}
