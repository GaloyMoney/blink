import {
  getFeeRates,
  getGenericLimits,
  getTwoFAConfig,
  getUserLimits,
  levels,
  MS_PER_30_DAYs,
  MS_PER_DAY,
  USER_ACTIVENESS_MONTHLY_VOLUME_THRESHOLD,
} from "@config/app"
import { UsernameRegex } from "@domain/users"
import { accountPath } from "@services/ledger/accounts"
import { Transaction } from "@services/ledger/schema"
import crypto from "crypto"
import * as _ from "lodash"
import * as mongoose from "mongoose"

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

const feeRates = getFeeRates()

const twoFAConfig = getTwoFAConfig()

const UserSchema = new Schema<UserType>({
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
    // TODO: rename to PhoneMetadata
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
    match: [UsernameRegex, "Username can only have alphabets, numbers and underscores"],
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

  title: {
    type: String,
    minlength: 3,
    maxlength: 100,
  },
  coordinates: {
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

  twoFA: {
    secret: {
      type: String,
    },
    threshold: {
      type: Number,
      default: twoFAConfig.threshold,
    },
  },

  walletPublicId: {
    type: String,
    index: true,
    unique: true,
    required: true,
    default: () => crypto.randomUUID(),
  },
})

// Define getter for ratioUsd
// FIXME: this // An outer value of 'this' is shadowed by this container.
// https://stackoverflow.com/questions/41944650/this-implicitly-has-type-any-because-it-does-not-have-a-type-annotation
UserSchema.virtual("ratioUsd").get(function (this: typeof UserSchema) {
  return _.find(this.currencies, { id: "USD" })?.ratio ?? 0
})

UserSchema.virtual("ratioBtc").get(function (this: typeof UserSchema) {
  return _.find(this.currencies, { id: "BTC" })?.ratio ?? 0
})

// this is the accounting path in medici for this user
UserSchema.virtual("accountPath").get(function (this: typeof UserSchema) {
  return accountPath(this._id)
})

UserSchema.virtual("oldEnoughForWithdrawal").get(function (this: typeof UserSchema) {
  const elapsed = Date.now() - this.created_at.getTime()
  const genericLimits = getGenericLimits()
  return elapsed > genericLimits.oldEnoughForWithdrawalMicroseconds
})

UserSchema.virtual("twoFAEnabled").get(function (this: typeof UserSchema) {
  return this.twoFA.secret != null
})

const getTimestampYesterday = () => Date.now() - MS_PER_DAY

UserSchema.methods.remainingTwoFALimit = async function () {
  const threshold = this.twoFA.threshold

  const txnType = [
    { type: "on_us" },
    { type: "onchain_on_us" },
    { type: "onchain_payment" },
    { type: "payment" },
  ]

  const { outgoingSats } = await User.getVolume({
    after: getTimestampYesterday(),
    txnType,
    accounts: this.accountPath,
  })

  return threshold - outgoingSats
}

UserSchema.methods.remainingWithdrawalLimit = async function () {
  if (!this.oldEnoughForWithdrawal) return 0

  const userLimits = getUserLimits({ level: this.level })
  const withdrawalLimit = userLimits.withdrawalLimit

  const { outgoingSats } = await User.getVolume({
    after: getTimestampYesterday(),
    txnType: [{ type: "on_us" }, { type: "onchain_on_us" }],
    accounts: this.accountPath,
  })

  return withdrawalLimit - outgoingSats
}

UserSchema.methods.remainingOnUsLimit = async function () {
  const userLimits = getUserLimits({ level: this.level })
  const onUsLimit = userLimits.onUsLimit

  const { outgoingSats } = await User.getVolume({
    after: getTimestampYesterday(),
    txnType: [{ type: "on_us" }, { type: "onchain_on_us" }],
    accounts: this.accountPath,
  })

  return onUsLimit - outgoingSats
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

  return {
    outgoingSats: result?.outgoingSats ?? 0,
    incomingSats: result?.incomingSats ?? 0,
  }
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
  const activenessThreshold = USER_ACTIVENESS_MONTHLY_VOLUME_THRESHOLD

  const volume = await User.getVolume({
    after: timestamp30DaysAgo,
    txnType: [{ type: { $exists: true } }],
    accounts: this.accountPath,
  })

  return (
    volume.outgoingSats > activenessThreshold || volume.incomingSats > activenessThreshold
  )
})

UserSchema.statics.getUserByAddress = async function ({ address }) {
  return this.findOne({ "onchain.address": address }, { lastIPs: 0, lastConnection: 0 })
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
  coordinates: 1,
})

export const User = mongoose.model<UserType>("User", UserSchema)

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

const accountApiKeySchema = new Schema({
  accountId: { type: String, index: true, required: true },
  label: { type: String, required: true },
  hashedKey: { type: String, unique: true, required: true },
  enabled: { type: Boolean, default: true },
  expireAt: { type: Date, required: true },
  timestamp: { type: Date, default: Date.now },
})

accountApiKeySchema.index({ accountId: 1, label: 1 }, { unique: true })
export const AccountApiKey = mongoose.model("AccountApiKey", accountApiKeySchema)
