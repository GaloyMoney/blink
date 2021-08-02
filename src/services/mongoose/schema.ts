import * as _ from "lodash"
import * as mongoose from "mongoose"
import {
  levels,
  getUserLimits,
  getGenericLimits,
  getFeeRates,
  MS_PER_DAY,
  MS_PER_30_DAYs,
} from "@config/app"
import { NotFoundError } from "@core/error"
import { accountPath } from "@core/ledger/accounts"
import { Transaction } from "@core/ledger/schema"
import { baseLogger } from "../logger"
import { caseInsensitiveRegex } from "@core/utils"

export { Transaction }

// mongoose.set("debug", true)

const Schema = mongoose.Schema

const dbMetadataSchema = new Schema({
  version: Number,
  minBuildNumber: Number,
  lastBuildNumber: Number,
  routingFeeLastEntry: Date,
})
export const DbMetadata = mongoose.model("DbMetadata", dbMetadataSchema)

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

  pubkey: {
    type: String,
    require: true,
  },

  paid: {
    type: Boolean,
    default: false,
  },
})

invoiceUserSchema.index({ uid: 1, paid: 1 })

export const InvoiceUser = mongoose.model("InvoiceUser", invoiceUserSchema)

export const regexUsername = /(?!^(1|3|bc1|lnbc1))^[0-9a-z_]+$/i

const feeRates = getFeeRates()

const UserSchema = new Schema({
  depositFeeRatio: {
    type: Number,
    default: feeRates.depositFeeVariable,
    min: 0,
    max: 1,
  },
  withdrawFee: {
    type: Number,
    default: feeRates.withdrawFeeFixed,
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
    // FIXME: role is a mix between 2 things here
    // there can be many users and editors
    // there can be only one dealer, bankowner and funder
    // so we may want different property to differentiate thoses
    enum: ["user", "editor", "dealer", "bankowner", "funder"],
    required: true,
    default: "user",
    // TODO : enfore the fact there can be only one dealer
  },

  onchain: {
    type: [
      {
        pubkey: {
          type: String,
          required: true,
        },
        address: {
          type: String,
          required: true,
        },
      },
    ],
    default: [],
  },
  level: {
    type: Number,
    enum: levels,
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
  return accountPath(this._id)
})

// eslint-disable-next-line no-unused-vars
UserSchema.virtual("oldEnoughForWithdrawal").get(function (this: typeof UserSchema) {
  const elapsed = Date.now() - this.created_at.getTime()
  const genericLimits = getGenericLimits()
  return elapsed > genericLimits.oldEnoughForWithdrawalMicroseconds
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

  const userLimits = getUserLimits({ level: this.level })
  const limit = on_us ? userLimits.onUsLimit : userLimits.withdrawalLimit

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

// FIXME: for onchain wallet from multiple wallet
// refactor with bitcoind wallet
UserSchema.virtual("onchain_addresses").get(function (this: typeof UserSchema) {
  return this.onchain.map((item) => item.address)
})

// return the list of nodes that this user has address associated to
UserSchema.virtual("onchain_pubkey").get(function (this: typeof UserSchema) {
  return _.uniq(this.onchain.map((item) => item.pubkey))
})

// user is considered active if there has been one transaction of more than 1000 sats in the last 30 days
// eslint-disable-next-line no-unused-vars
UserSchema.virtual("userIsActive").get(async function (this: typeof UserSchema) {
  const timestamp30DaysAgo = Date.now() - MS_PER_30_DAYs

  const volume = await User.getVolume({
    after: timestamp30DaysAgo,
    txnType: [{ type: { $exists: true } }],
    accounts: this.accountPath,
  })

  return volume?.outgoingSats > 1000 || volume?.incomingSats > 1000
})

UserSchema.statics.getUserByPhone = async function (phone: string) {
  const user = await this.findOne({ phone })

  if (!user) {
    throw new NotFoundError("User not found", { logger: baseLogger })
  }

  return user
}

UserSchema.statics.getUserByUsername = async function (username: string) {
  if (!username.match(regexUsername)) {
    return null
  }

  const user = await this.findOne({ username: caseInsensitiveRegex(username) })

  if (!user) {
    throw new NotFoundError("User not found", { logger: baseLogger })
  }

  return user
}

UserSchema.statics.getUserByAddress = async function ({ address }) {
  return await this.findOne({ "onchain.address": address })
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

UserSchema.index({
  title: 1,
  coordinate: 1,
})

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
  sms_provider: String,
})

export const PhoneCode = mongoose.model("PhoneCode", PhoneCodeSchema)

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
