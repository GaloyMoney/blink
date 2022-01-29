import { PaymentStatus } from "@domain/bitcoin/lightning"
import * as mongoose from "mongoose"

const Schema = mongoose.Schema

const confirmedDetailsSchema = new Schema<LnPaymentConfirmedDetails>({
  confirmedAt: Date,
  destination: String,
  revealedPreImage: String,
  roundedUpFee: Number,
  milliSatsFee: Number,
  hopPubkeys: [String],
})

const paymentAttemptSchema = Schema.Types.Mixed

const paymentSchema = new Schema<LnPaymentType>({
  createdAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: Object.values(PaymentStatus),
    required: true,
  },
  paymentHash: {
    type: String,
    index: true,
    unique: true,
    required: true,
  },
  paymentRequest: {
    type: String,
    required: true,
  },
  sentFromPubkey: {
    type: String,
    required: true,
  },
  milliSatsAmount: String,
  roundedUpAmount: Number,
  confirmedDetails: confirmedDetailsSchema,
  attempts: [paymentAttemptSchema],
  isCompleteRecord: {
    type: Boolean,
    default: false,
  },
})

export const LnPayment = mongoose.model("LnPayment", paymentSchema)
