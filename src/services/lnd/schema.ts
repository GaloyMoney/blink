import * as mongoose from "mongoose"

const Schema = mongoose.Schema

const hopSchema = new Schema({
  channel: String,
  channel_capacity: {
    type: Number,
    min: 0,
  },
  fee: {
    type: Number,
    default: 0,
  },
  fee_mtokens: String,
  forward: {
    type: Number,
    min: 0,
  },
  forward_mtokens: String,
  public_key: String,
  timeout: {
    type: Number,
    min: 0,
  },
})

const pathSchema = new Schema({
  fee: {
    type: Number,
    default: 0,
  },
  fee_mtokens: String,
  hops: [hopSchema],
  mtokens: String,
  payment: String,
  timeout: {
    type: Number,
    min: 0,
  },
  tokens: {
    type: Number,
    min: 0,
  },
  total_mtokens: String,
})

const paymentDetailsSchema = new Schema<LnPaymentDetails>({
  confirmedAt: Date,
  destination: String,
  milliSatsFee: {
    type: Number,
    default: 0,
  },
  milliSatsAmount: {
    type: Number,
    min: 0,
  },
  paths: [pathSchema],
  roundedUpFee: {
    type: Number,
    default: 0,
  },
  secret: String,
  amount: {
    type: Number,
    min: 0,
  },
})

const paymentSchema = new Schema<LnPaymentType>({
  createdAt: Date,
  status: {
    type: String,
    enum: ["settled", "failed", "pending"],
    required: true,
  },
  paymentHash: {
    type: String,
    index: true,
    unique: true,
    required: true,
  },
  paymentRequest: String,
  paymentDetails: paymentDetailsSchema,
})

export const LnPayment = mongoose.model("LnPayment", paymentSchema)
