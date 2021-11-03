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

const paymentSchema = new Schema<LnPaymentType>({
  status: { type: String, enum: ["settled", "failed", "pending"], required: true },
  confirmedAt: Date,
  createdAt: Date,
  destination: String,
  milliSatsFee: {
    type: Number,
    default: 0,
  },
  paymentHash: String,
  milliSatsAmount: {
    type: Number,
    min: 0,
  },
  paths: [pathSchema],
  paymentRequest: String,
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

export const LnPayment = mongoose.model("LnPayment", paymentSchema)
