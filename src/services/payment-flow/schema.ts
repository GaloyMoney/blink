import mongoose from "mongoose"

// TODO migration:
// rename type: on_us to intraledger

const Schema = mongoose.Schema

const paymentFlowStateSchema = new Schema<PaymentFlowStateRecord>(
  {
    senderWalletId: { type: String, required: true },
    senderWalletCurrency: { type: String, required: true },
    settlementMethod: { type: String, required: true },
    paymentInitiationMethod: { type: String, required: true },
    paymentHash: String,
    intraLedgerHash: String,
    createdAt: { type: Date, required: true },
    paymentSentAndPending: { type: Boolean, required: true },
    descriptionFromInvoice: String,

    btcPaymentAmount: { type: Number, required: true },
    usdPaymentAmount: { type: Number, required: true },
    inputAmount: { type: Number, required: true },

    btcProtocolFee: { type: Number, required: true },
    usdProtocolFee: { type: Number, required: true },

    recipientWalletId: String,
    recipientWalletCurrency: String,
    recipientPubkey: String,
    recipientUsername: String,

    outgoingNodePubkey: String,
    cachedRoute: Schema.Types.Mixed,
  },
  { id: false },
)

paymentFlowStateSchema.index({
  paymentHash: 1,
})

export const PaymentFlowState = mongoose.model(
  "Payment_Flow_State",
  paymentFlowStateSchema,
)
