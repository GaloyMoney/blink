import * as mongoose from "mongoose"

const Schema = mongoose.Schema

const transactionSchema = new Schema({
  hash: {
    type: Schema.Types.String,
    ref: "InvoiceUser",
    // TODO: not always, use another hashOnchain?
  },

  // used for escrow transaction, to know which channel this transaction is associated with
  // FIXME? hash is currently used for onchain tx but txid should be used instead?
  // an onchain output is deterministically represented by hash of tx + vout
  txid: String,

  type: {
    required: true,
    type: String,
    enum: [
      // TODO: merge with the Interface located in types.ts?
      "invoice",
      "payment",
      "on_us",
      "fee_reimbursement", // lightning
      "onchain_receipt",
      "onchain_payment",
      "onchain_on_us",
      "deposit_fee", // onchain
      "fee",
      "escrow",
      "routing_fee", // channel-related
      "exchange_rebalance", // send/receive btc from the exchange
      "user_rebalance", // buy/sell btc in the user wallet
      "to_cold_storage",
      "to_hot_wallet",
    ],
  },

  // used to denote confirmation status of on and off chain txn
  // for sending payment on lightning, pending will be true in case of timeout
  // for sending payment on chain, pending will be true until the transaction get mined
  // pending is not used for receiving transaction.
  pending: {
    type: Boolean,
    required: true,
  },

  err: String,
  currency: {
    type: String,
    enum: ["USD", "BTC"],
    required: true,
  },

  // used as metadata only to know for a particular transaction what was the split between
  // USD and BTC
  // TODO implement this to make it relevant for the user
  currencies: {
    // TODO: refactor with user
    type: [
      {
        id: {
          type: String,
          enum: ["BTC", "USD"],
          required: true,
        },
        ratio: {
          type: Number,
          required: true,
          min: 0,
          max: 1,
        },
      },
    ],
  },

  fee: {
    type: Number,
    default: 0,
  },

  // for fee updated
  feeKnownInAdvance: {
    type: Boolean,
  },
  related_journal: Schema.Types.ObjectId,

  // for onchain transactions.
  payee_addresses: [String],

  memoPayer: String,

  // not used for accounting but used for usd/sats equivalent
  usd: Number,
  sats: Number,
  feeUsd: {
    type: Number,
    default: 0,
  },

  // when transaction with on_us transaction, this is the other party username
  // TODO: refactor, define username as a type so that every property that should be an username can inherit from those parameters
  username: {
    type: String,
    match: [
      /(?!^(1|3|bc1|lnbc1))^[0-9a-z_]+$/i,
      "Username can only have alphabets, numbers and underscores",
    ],
    minlength: 3,
    maxlength: 50,
  },

  // which lnd node this transaction relates to
  pubkey: String,

  // original property from medici
  credit: {
    type: Number,
    min: 0,
  },
  debit: {
    type: Number,
    min: 0,
  },
  meta: Schema.Types.Mixed,
  datetime: Date,
  account_path: [String],
  accounts: String,
  book: String,
  memo: String,
  _journal: {
    type: Schema.Types.ObjectId,
    ref: "Medici_Journal",
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  voided: {
    type: Boolean,
    default: false,
  },
  void_reason: String,
  // The journal that this is voiding, if any
  _original_journal: Schema.Types.ObjectId,
  approved: {
    type: Boolean,
    default: true,
  },
})

//indexes used by our queries
transactionSchema.index({ type: 1, pending: 1, account_path: 1 })
transactionSchema.index({ account_path: 1 })
transactionSchema.index({ hash: 1 })

//indexes used by medici internally, and also set by default
//we are setting them here manually because we are using a custom schema
transactionSchema.index({ _journal: 1 })
transactionSchema.index({
  accounts: 1,
  book: 1,
  approved: 1,
  datetime: -1,
  timestamp: -1,
})
transactionSchema.index({ "account_path.0": 1, "book": 1, "approved": 1 })
transactionSchema.index({
  "account_path.0": 1,
  "account_path.1": 1,
  "book": 1,
  "approved": 1,
})
transactionSchema.index({
  "account_path.0": 1,
  "account_path.1": 1,
  "account_path.2": 1,
  "book": 1,
  "approved": 1,
})

export const Transaction = mongoose.model("Medici_Transaction", transactionSchema)
