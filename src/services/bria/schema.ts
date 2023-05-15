import mongoose, { Schema, Document } from "mongoose"

type BriaEventDocument = BriaEvent & Document

const AddressAugmentationSchema = new Schema<AddressAugmentation>(
  {
    address: String,
    externalId: String,
  },
  { _id: false },
)

const BriaPayloadSchema = new Schema<BriaPayload>(
  {
    type: String,
    txId: String,
    vout: Number,
    satoshis: Number,
    address: String,
    blockNumber: Number,
    id: String,
  },
  { _id: false },
)

const BriaEventSchema = new Schema<BriaEventDocument>({
  sequence: { type: Number, required: true },
  payload: { type: BriaPayloadSchema, required: true },
  augmentation: AddressAugmentationSchema,
})

export const BriaEventModel = mongoose.model<BriaEventDocument>(
  "BriaEventSequence",
  BriaEventSchema,
)
