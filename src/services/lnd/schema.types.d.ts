interface LnPaymentType {
  id: string
  createdAt: Date
  status: string
  paymentHash: string
  paymentRequest: string
  milliSatsAmount: string
  roundedUpAmount: number
  confirmedDetails: LnPaymentConfirmedDetails | undefined
  attempts: LnPaymentAttempt[]
  isCompleteRecord: boolean
}
