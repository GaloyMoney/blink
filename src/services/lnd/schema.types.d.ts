interface LnPaymentType {
  id: string
  _id: string
  isCompleteRecord: boolean
  createdAt: Date
  status: string
  paymentHash: string
  paymentRequest: string
  paymentDetails: LnPaymentDetails | undefined
  attempts: LnPaymentAttempt[]
}
