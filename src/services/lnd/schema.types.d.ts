interface LnPaymentDetails {
  confirmedAt: Date
  createdAt: Date
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
  status: string
  paymentHash: string
  paymentRequest: string
  paymentDetails: LnPaymentDetails
}
