import * as mongoose from "mongoose"
import { LedgerTransactionType } from "@domain/ledger"

const Schema = mongoose.Schema

const ledgerTransactionTypes = Object.values(LedgerTransactionType)

const transactionSchema = new Schema({
  hash: {
    type: Schema.Types.String,
    ref: "invoiceusers",
    // TODO: not always, use another hashOnchain?
  },

  // used for escrow transaction, to know which channel this transaction is associated with
  // FIXME? hash is currently used for onchain tx but txid should be used instead?
  // an onchain output is deterministically represented by hash of tx + vout
  txid: String,

  type: {
    required: true,
    type: String,
    enum: ledgerTransactionTypes,
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
  usd: Number, // TODO: should be renamed to amountDisplayCurrency

  sats: Number, // TODO: should be removed?

  feeUsd: {
    // TODO: should be renamed feeDisplayCurrency
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
  accounts: {
    type: String,
    validate: {
      validator: function (v) {
        // liabilities account should be uuid-v4
        if (v.startsWith("Liabilities")) return v.length === 12 + 36
        else return true
      },
    },
  },
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
transactionSchema.index({ accounts: 1, type: 1, timestamp: -1 })
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
// TODO: look at if this one is still needed. maybe we only have 2 levels now?
// following this refactoring: https://github.com/GaloyMoney/galoy/pull/377
transactionSchema.index({
  "account_path.0": 1,
  "account_path.1": 1,
  "account_path.2": 1,
  "book": 1,
  "approved": 1,
})

export const Transaction = mongoose.model("Medici_Transaction", transactionSchema)
