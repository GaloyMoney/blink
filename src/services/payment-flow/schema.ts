import * as mongoose from "mongoose"

// TODO migration:
// rename type: on_us to intraledger

const Schema = mongoose.Schema

const paymentFlowStateSchema = new Schema<PaymentFlowStateRecord>(
  {
    senderWalletId: String,
    senderWalletCurrency: String,
    settlementMethod: String,
    paymentInitiationMethod: String,
    paymentHash: String,
    descriptionFromInvoice: String,

    btcPaymentAmount: Number,
    usdPaymentAmount: Number,
    inputAmount: Number,

    btcProtocolFee: Number,
    usdProtocolFee: Number,

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
