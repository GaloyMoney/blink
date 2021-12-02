interface LnPaymentDetails {
  confirmedAt: Date
  destination: string
  milliSatsFee: number
  milliSatsAmount: number
  paths: RawPaths
  roundedUpFee: number
  secret: string
  amount: number
}
interface LnPaymentType {
  id: string
  _id: string
  createdAt: Date
  status: string
  paymentHash: string
  paymentRequest: string
  paymentDetails: LnPaymentDetails
}
