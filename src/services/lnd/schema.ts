import * as mongoose from "mongoose"

const Schema = mongoose.Schema

const confirmedDetailsSchema = new Schema<LnPaymentConfirmedDetails>({
  confirmedAt: {
    type: Date,
    required: true,
  },
  destination: {
    type: String,
    required: true,
  },
  revealedPreImage: {
    type: String,
    required: true,
  },
  roundedUpFee: {
    type: Number,
    required: true,
  },
  milliSatsFee: {
    type: Number,
    required: true,
  },
  hopPubkeys: [String],
})

const paymentAttemptSchema = Schema.Types.Mixed

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
  paymentRequest: {
    type: String,
    unique: true,
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
