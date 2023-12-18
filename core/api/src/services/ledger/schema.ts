import mongoose from "mongoose"

import { setTransactionSchema } from "medici"

import { LedgerTransactionType } from "@/domain/ledger"

// TODO migration:
// rename type: on_us to intraledger

const Schema = mongoose.Schema

const ledgerTransactionTypes = Object.values(LedgerTransactionType)

const transactionSchema = new Schema<ILedgerTransaction>(
  {
    hash: {
      type: Schema.Types.String,
      ref: "invoiceusers",
      // TODO: not always, use another hashOnchain?
    },
    vout: Number,

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

    currency: {
      type: String,
      enum: ["USD", "BTC"],
      required: true,
    },

    // for fee updated
    feeKnownInAdvance: {
      type: Boolean,
    },
    related_journal: Schema.Types.ObjectId,

    // for onchain transactions.
    payee_addresses: [String],
    request_id: String,
    payout_id: String,

    memoPayer: String,

    sats: Number, // TODO: should be removed?

    satsAmount: Number,
    centsAmount: Number,
    satsFee: {
      type: Number,
      default: 0,
    },
    centsFee: {
      type: Number,
      default: 0,
    },

    displayAmount: Number,
    displayFee: {
      type: Number,
      default: 0,
    },
    displayCurrency: {
      type: String,
      default: "USD",
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
    credit: Number,
    debit: Number,
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
    timestamp: Date,
    voided: Boolean,
    void_reason: String,
    // The journal that this is voiding, if any
    _original_journal: {
      type: Schema.Types.ObjectId,
      ref: "Medici_Journal",
    },

    // FIXME: Admin-only, to be removed with satsAmount changes
    fee: {
      type: Number,
      default: 0,
    },
    feeUsd: {
      type: Number,
      default: 0,
    },
    usd: Number,
  },
  { id: false, versionKey: false, timestamps: false },
)

//indexes used by our queries
transactionSchema.index({ accounts: 1, book: 1, datetime: -1, timestamp: -1, _id: -1 })
transactionSchema.index({ accounts: 1, type: 1, timestamp: -1 })
transactionSchema.index({ type: 1, pending: 1, account_path: 1 })
transactionSchema.index({ account_path: 1 })
transactionSchema.index({ hash: 1 })
transactionSchema.index({ payout_id: 1 })

setTransactionSchema(transactionSchema, undefined, { defaultIndexes: true })

export const Transaction = mongoose.model<ILedgerTransaction>(
  "Medici_Transaction",
  transactionSchema,
)

const transactionMetadataSchema = new Schema<TransactionMetadataRecord>(
  {
    hash: String,
    revealedPreImage: {
      type: String,
      index: true,
    },
    swap: Schema.Types.Mixed,
  },
  { id: false },
)

transactionMetadataSchema.index({
  hash: 1,
})

export const TransactionMetadata = mongoose.model(
  "Medici_Transaction_Metadata",
  transactionMetadataSchema,
)
