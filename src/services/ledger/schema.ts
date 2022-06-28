import * as mongoose from "mongoose"
import { LedgerTransactionType } from "@domain/ledger"
import { setTransactionSchema, ITransaction as ITransactionMedici } from "medici"

// TODO migration:
// rename type: on_us to intraledger

const Schema = mongoose.Schema

const ledgerTransactionTypes = Object.values(LedgerTransactionType)

interface ITransaction extends ITransactionMedici {
  hash?: string
  txid?: string
  type: LedgerTransactionType
  pending: boolean
  err?: string
  currency: WalletCurrency
  fee: number
  feeKnownInAdvance?: boolean
  related_journal?: mongoose.Types.ObjectId
  payee_addresses?: string[]
  memoPayer?: string
  usd?: number
  sats?: number
  feeUsd?: number
  username?: string
  pubkey?: string

  satsAmount: number
  centsAmount: number
  satsFee: number
  centsFee: number
  displayAmount: number
  displayFee: number
  displayCurrency: string
}

const transactionSchema = new Schema<ITransaction>(
  {
    hash: {
      type: Schema.Types.String,
      ref: "InvoiceUser",

      // FIXME(nicolas, juan), was:
      // ref: "invoiceusers",

      // TODO: not always, use another hashOnchain?
    },

    currency: {
      type: String,
      enum: ["USD", "BTC"],
      required: true,
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
      enum: ["USD", "BTC", "CRC"],
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

    // not used for accounting but used for usd/sats equivalent
    usd: Number, // TODO: should be renamed to amountDisplayCurrency

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
        validator: function (v: string) {
          // liabilities account should be uuid-v4
          if (v.startsWith("Liabilities")) return v.length === 12 + 36
          else return true
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
      _original_journal: {
        type: Schema.Types.ObjectId,
        ref: "Medici_Journal",
      },
    },
  },
  { id: false, versionKey: false, timestamps: false },
)

//indexes used by our queries
transactionSchema.index({ accounts: 1, type: 1, timestamp: -1 })
transactionSchema.index({ type: 1, pending: 1, account_path: 1 })
transactionSchema.index({ account_path: 1 })
transactionSchema.index({ hash: 1 })

setTransactionSchema(transactionSchema, undefined, { defaultIndexes: true })

export const Transaction = mongoose.model("Medici_Transaction", transactionSchema)

const transactionMetadataSchema = new Schema<TransactionMetadataRecord>(
  {
    hash: String,
    revealedPreImage: {
      type: String,
      index: true,
    },
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
