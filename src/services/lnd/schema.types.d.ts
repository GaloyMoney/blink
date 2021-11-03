interface LnPaymentType {
  id: string
  _id: string
  status: string
  confirmedAt: Date
  createdAt: Date
  destination: string
  milliSatsFee: number
  paymentHash: string
  milliSatsAmount: number
  paths: RawPaths
  paymentRequest: string
  roundedUpFee: number
  secret: string
  amount: number
}
