import * as _ from "lodash"
import * as mongoose from "mongoose"
import { yamlConfig } from "./config"
import { NotFoundError } from "./error"
import { customerPath } from "./ledger/ledger"
import { baseLogger } from "./logger"
import { Levels } from "./types"
import { caseInsensitiveRegex, inputXOR } from "./utils"

// mongoose.set("debug", true)

const Schema = mongoose.Schema

const dbMetadataSchema = new Schema({
  version: Number,
  minBuildNumber: Number,
  lastBuildNumber: Number,
  routingFeeLastEntry: Date,
})
export const DbMetadata = mongoose.model("DbMetadata", dbMetadataSchema)

const MS_PER_DAY = 24 * 60 * 60 * 1000

const invoiceUserSchema = new Schema({
  _id: String, // hash of invoice
  uid: String,

  // usd equivalent. sats is attached in the invoice directly.
  // optional, as BTC wallet doesn't have to set a sat amount when creating the invoice
  usd: Number,

  timestamp: {
    type: Date,
    default: Date.now,
  },

  selfGenerated: {
    type: Boolean,
    default: true,
  },
})

invoiceUserSchema.index({ uid: 1 })

export const InvoiceUser = mongoose.model("InvoiceUser", invoiceUserSchema)

export const regexUsername = /(?!^(1|3|bc1|lnbc1))^[0-9a-z_]+$/i

const UserSchema = new Schema({
  depositFeeRatio: {
    type: Number,
    default: yamlConfig.fees.deposit,
    min: 0,
    max: 1,
  },
  withdrawFee: {
    type: Number,
    default: yamlConfig.fees.withdraw,
    min: 0,
  },
  lastConnection: Date,
  lastIPs: {
    type: [
      {
        ip: String,
        provider: String,
        country: String,
        region: String,
        city: String,
        //using Type instead of type due to its special status in mongoose
        Type: String,
        firstConnection: {
          type: Date,
          default: Date.now,
        },
        lastConnection: Date,
      },
    ],
    default: [],
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  earn: {
    type: [String],
    default: [],
  },
  role: {
    type: String,
    enum: ["user", "dealer", "editor"],
    required: true,
    default: "user",
    // TODO : enfore the fact there can be only one dealer
  },
  onchain_addresses: {
    type: [String],
    default: [],
  },
  level: {
    type: Number,
    enum: Levels,
    default: 1,
  },

  // TODO: refactor, have phone and twilio metadata in the same sub-object.
  phone: {
    // TODO we should store country as a separate string
    type: String,
    required: true,
    unique: true,
  },
  twilio: {
    carrier: {
      error_code: String, // check this is the right syntax
      mobile_country_code: String,
      mobile_network_code: String,
      name: String,
      type: {
        types: String,
        enum: ["landline", "voip", "mobile"],
      },
    },
    countryCode: String,
  },

  username: {
    type: String,
    match: [regexUsername, "Username can only have alphabets, numbers and underscores"],
    minlength: 3,
    maxlength: 50,
    index: {
      unique: true,
      collation: { locale: "en", strength: 2 },
      partialFilterExpression: { username: { $type: "string" } },
    },
  },
  deviceToken: {
    type: [String],
    default: [],
  },
  currencies: {
    validate: {
      validator: function (v) {
        return _.sumBy(v, "ratio") === 1
      },
    },
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
    required: true,
    default: [{ id: "BTC", ratio: 1 }],
  },
  contacts: {
    type: [
      {
        id: {
          type: String,
          collation: { locale: "en", strength: 2 },
        },
        name: String,
        transactionsCount: {
          type: Number,
          default: 1,
        },
      },
    ],
    default: [],
  },
  language: {
    type: String,
    enum: ["en", "es", ""],
    default: "",
  },
  // firstName,
  // lastName,
  // activated,
  // etc

  title: String,
  coordinate: {
    type: {
      latitude: {
        type: Number,
      },
      longitude: {
        type: Number,
      },
    },
  },

  excludeCashback: {
    type: Boolean,
    default: false,
  },

  status: {
    type: String,
    enum: ["active", "locked"],
    default: "active",
  },
})

// Define getter for ratioUsd
// FIXME: this // An outer value of 'this' is shadowed by this container.
// https://stackoverflow.com/questions/41944650/this-implicitly-has-type-any-because-it-does-not-have-a-type-annotation
// eslint-disable-next-line no-unused-vars
UserSchema.virtual("ratioUsd").get(function (this: typeof UserSchema) {
  return _.find(this.currencies, { id: "USD" })?.ratio ?? 0
})

// eslint-disable-next-line no-unused-vars
UserSchema.virtual("ratioBtc").get(function (this: typeof UserSchema) {
  return _.find(this.currencies, { id: "BTC" })?.ratio ?? 0
})

// this is the accounting path in medici for this user
// eslint-disable-next-line no-unused-vars
UserSchema.virtual("accountPath").get(function (this: typeof UserSchema) {
  return customerPath(this._id)
})

// eslint-disable-next-line no-unused-vars
UserSchema.virtual("oldEnoughForWithdrawal").get(function (this: typeof UserSchema) {
  const d = Date.now()
  // console.log({d, created_at: this.created_at.getTime(), oldEnough: yamlConfig.limits.oldEnoughForWithdrawal})
  return d - this.created_at.getTime() > yamlConfig.limits.oldEnoughForWithdrawal
})

UserSchema.methods.limitHit = async function ({
  on_us,
  amount,
}: {
  on_us: boolean
  amount: number
}) {
  const timestampYesterday = Date.now() - MS_PER_DAY

  const txnType = on_us
    ? [{ type: "on_us" }, { type: "onchain_on_us" }]
    : [{ type: { $ne: "on_us" } }]

  const limit = yamlConfig.limits[on_us ? "onUs" : "withdrawal"].level[this.level]

  const outgoingSats =
    (
      await User.getVolume({
        after: timestampYesterday,
        txnType,
        accounts: this.accountPath,
      })
    )?.outgoingSats ?? 0

  return outgoingSats + amount > limit
}

UserSchema.statics.getVolume = async function ({
  before,
  after,
  accounts,
  txnType,
}: {
  before?: number
  after: number
  accounts: string
  txnType: [string]
}) {
  const timeBounds = before
    ? [
        { timestamp: { $gte: new Date(after) } },
        { timestamp: { $lte: new Date(before) } },
      ]
    : [{ timestamp: { $gte: new Date(after) } }]
  const [result] = await Transaction.aggregate([
    { $match: { accounts, $or: txnType, $and: timeBounds } },
    {
      $group: {
        _id: null,
        outgoingSats: { $sum: "$debit" },
        incomingSats: { $sum: "$credit" },
      },
    },
  ])
  return result
}

// user is considered active if there has been one transaction of more than 1000 sats in the last 30 days
// eslint-disable-next-line no-unused-vars
UserSchema.virtual("userIsActive").get(async function (this: typeof UserSchema) {
  const timestamp30DaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000

  const volume = await User.getVolume({
    after: timestamp30DaysAgo,
    txnType: [{ type: { $exists: true } }],
    accounts: this.accountPath,
  })

  return volume?.outgoingSats > 1000 || volume?.incomingSats > 1000
})

UserSchema.index({
  title: 1,
  coordinate: 1,
})

UserSchema.statics.getUser = async function ({ username, phone }) {
  inputXOR({ phone }, { username })
  let user

  if (phone) {
    user = await this.findOne({ phone })
  } else {
    user = await this.findByUsername({ username })
  }

  if (!user) {
    throw new NotFoundError("User not found", { logger: baseLogger })
  }

  return user
}

// FIXME: Merge findByUsername and getUser
UserSchema.statics.findByUsername = async function ({ username }) {
  if (typeof username !== "string" || !username.match(regexUsername)) {
    return null
  }

  return this.findOne({ username: caseInsensitiveRegex(username) })
}

UserSchema.statics.getActiveUsers = async function (): Promise<Array<typeof User>> {
  const users = await this.find({})
  const activeUsers: Array<typeof User> = []
  for (const user of users) {
    if (await user.userIsActive) {
      activeUsers.push(user)
    }
  }
  return activeUsers
}

export const User = mongoose.model("User", UserSchema)

// TODO: this DB should be capped.
const PhoneCodeSchema = new Schema({
  created_at: {
    type: Date,
    default: Date.now,
    required: true,
  },
  phone: {
    // TODO we should store country as a separate string
    type: String,
    required: true,
  },
  code: {
    type: Number,
    required: true,
  },
})

export const PhoneCode = mongoose.model("PhoneCode", PhoneCodeSchema)

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

const priceSchema = new Schema({
  // TODO:
  // split array in days instead of one big array.
  // More background here:
  // https://www.mongodb.com/blog/post/time-series-data-and-mongodb-part-2-schema-design-best-practices
  _id: {
    type: Date, // TODO does _id would prevent having several key (ie: Date) for other exchanges?
    unique: true,
  },
  o: Number, // opening price
})

// price History
const priceHistorySchema = new Schema({
  pair: {
    name: {
      type: String,
      enum: ["BTC/USD"],
    },
    exchange: {
      name: {
        type: String,
        // enum: ["kraken"], // others
      },
      price: [priceSchema],
    },
  },
})

export const PriceHistory = mongoose.model("PriceHistory", priceHistorySchema)
