import _ from 'lodash';

import { customerPath } from "./ledger/ledger";
import { yamlConfig } from "./config"

import mongoose from "mongoose";
import { caseInsensitiveRegex, inputXOR, LoggedError } from './utils';
// mongoose.set("debug", true);

const Schema = mongoose.Schema;




const dbVersionSchema = new Schema({
  version: Number,
  minBuildNumber: Number,
  lastBuildNumber: Number,
})
export const DbVersion = mongoose.model("DbVersion", dbVersionSchema)


const invoiceUserSchema = new Schema({
  _id: String, // hash of invoice
  uid: String,

  // usd equivalent. sats is attached in the invoice directly.
  // optional, as BTC wallet doesn't have to set a sat amount when creating the invoice
  usd: Number,

  timestamp: {
    type: Date,
    default: Date.now
  },

  selfGenerated: {
    type: Boolean,
    default: true
  },

})

invoiceUserSchema.index({ "uid": 1 })


export const InvoiceUser = mongoose.model("InvoiceUser", invoiceUserSchema)

export const regexUsername = /(?!^(1|3|bc1|lnbc1))^[0-9a-z_]+$/i



const UserSchema = new Schema({
  lastConnection: {
    type: Date
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  earn: {
    type: [String],
    default: []
  },
  role: {
    type: String,
    enum: ["user", "dealer", "editor"],
    required: true,
    default: "user"
    // TODO : enfore the fact there can be only one dealer
  },
  onchain_addresses: {
    type: [String],
    default: []
  },
  level: {
    type: Number,
    default: 1
  },

  // TODO: refactor, have phone and twilio metadata in the same sub-object.
  phone: { // TODO we should store country as a separate string
    type: String,
    required: true,
    unique: true,
  },
  twilio: {
    carrier: {
      error_code: String , // check this is the right syntax
      mobile_country_code: String,
      mobile_network_code: String,
      name: String,
      type: {
        types: String,
        enum: ["landline", "voip", "mobile"]
      }
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
      partialFilterExpression: { username: { $type: "string" } }
    }
  },
  deviceToken: {
    type: [String],
    default: []
  },
  currencies: {
    validate: {
      validator: function(v) {
        return _.sumBy(v, 'ratio') == 1
      },
    },
    type: [{
      id: {
        type: String,
        enum: ["BTC", "USD"],
        required: true
      },
      ratio: {
        type: Number,
        required: true,
        min: 0,
        max: 1,
      }
    }],
    required: true,
    default: [{ id: "BTC", ratio: 1 }]
  },
  contacts: {
    type: [{
      id: {
        type: String,
        collation: { locale: "en", strength: 2 },
      },
      name: String,
      transactionsCount: {
        type: Number,
        default: 1,
      }
    }],
    default: [],
  },
  language: {
    type: String,
    enum: ["en", "es", ""],
    default: ""
  },
  // firstName,
  // lastName,
  // activated,
  // etc

  title: String,
  coordinate: {
    type: {
      latitude: {
        type: Number
      },
      longitude: {
        type: Number
      }
    },
  },

  excludeCashback: {
    type: Boolean,
    default: false
  },

  status: {
    type: String,
    enum: ["active", "locked"],
    default: "active"
  }
})

// Define getter for ratioUsd
// FIXME: this // An outer value of 'this' is shadowed by this container.
// https://stackoverflow.com/questions/41944650/this-implicitly-has-type-any-because-it-does-not-have-a-type-annotation
UserSchema.virtual('ratioUsd').get(function(this: typeof UserSchema) {
  return _.find(this.currencies, { id: "USD" })?.ratio ?? 0
});

UserSchema.virtual('ratioBtc').get(function(this: typeof UserSchema) {
  return _.find(this.currencies, { id: "BTC" })?.ratio ?? 0
});

// this is the accounting path in medici for this user
UserSchema.virtual('accountPath').get(function(this: typeof UserSchema) {
  return customerPath(this._id)
})

UserSchema.virtual('oldEnoughForWithdrawal').get(function(this: typeof UserSchema) {
  // TODO make this configurable
  return (Date.now() - this.created_at) > 1000 * 60 * 60 * 24 * 7
})

UserSchema.methods.withdrawalLimitHit = async function({amount}) {
  const timestampYesterday = new Date(Date.now() - (24 * 60 * 60 * 1000))
  const [result] = await Transaction.aggregate([
    {$match: {"accounts": this.accountPath, type: {$ne: 'on_us'}, "timestamp": { $gte: timestampYesterday }}},
    {$group: {_id: null, outgoingSats: { $sum: "$debit" }}}
  ])
  const { outgoingSats } = result || {outgoingSats: 0}
  if(outgoingSats + amount >= yamlConfig.withdrawLimit) {
    return true
  }
  return false
}

// user is considered active if there has been one transaction of more than 1000 sats in the last 30 days
UserSchema.virtual('userIsActive').get(async function(this: typeof UserSchema) {
  const timestamp30DaysAgo = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000))
  const [result] = await Transaction.aggregate([
    { $match: { "accounts": this.accountPath, "timestamp": { $gte: timestamp30DaysAgo } } },
    {
      $group: {
        _id: null, outgoingSats: { $sum: "$credit" }, incomingSats: { $sum: "$debit" }
      }
    }
  ])
  const { incomingSats, outgoingSats } = result || {}

  return (outgoingSats > 1000 || incomingSats > 1000)
})

UserSchema.index({
  title: 1,
  coordinate: 1,
});

UserSchema.statics.getUser = async function({ username, phone }) {
  inputXOR({ phone }, { username })
  let user;

  if(phone) {
    user = await this.findOne({ phone })
  } else {
    user = await this.findByUsername({ username })
  }

  if(!user) {
    throw new LoggedError("User not found");
  }

  return user;
}

// FIXME: Merge findByUsername and getUser
UserSchema.statics.findByUsername = async function({ username }) {
  if(typeof username !== "string" || !username.match(regexUsername)) {
    return null
  }

  return this.findOne({ username: caseInsensitiveRegex(username) })
}

UserSchema.statics.getActiveUsers = async function(): Promise<Array<typeof User>> {
  const users = await this.find({})
  const activeUsers: Array<typeof User> = []
  for(const user of users) {
    if(await user.userIsActive) {
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
  phone: { // TODO we should store country as a separate string
    type: String,
    required: true,
  },
  code: {
    type: Number,
    required: true,
  }
})

export const PhoneCode = mongoose.model("PhoneCode", PhoneCodeSchema)


const transactionSchema = new Schema({

  hash: {
    type: Schema.Types.String,
    ref: 'InvoiceUser'
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
      "invoice", "payment", "on_us", "fee_reimbursement", // lightning
      "onchain_receipt", "onchain_payment", "onchain_on_us", // onchain
      "fee", "escrow", // channel-related
      "exchange_rebalance", // send/receive btc from the exchange
      "user_rebalance", // buy/sell btc in the user wallet
      "to_cold_storage", "to_hot_wallet"
    ]
  },

  // used to denote confirmation status of on and off chain txn
  // for sending payment on lightning, pending will be true in case of timeout
  // for sending payment on chain, pending will be true until the transaction get mined
  // pending is not used for receiving transaction.
  pending: {
    type: Boolean,
    required: true
  },

  err: String,
  currency: {
    type: String,
    enum: ["USD", "BTC"],
    required: true
  },

  // used as metadata only to know for a particular transaction what was the split between
  // USD and BTC
  // TODO implement this to make it relevant for the user
  currencies: {
    // TODO: refactor with user
    type: [{
      id: {
        type: String,
        enum: ["BTC", "USD"],
        required: true
      },
      ratio: {
        type: Number,
        required: true,
        min: 0,
        max: 1,
      }
    }],
  },

  fee: {
    type: Number,
    default: 0
  },

  // for fee updated
  feeKnownInAdvance: {
    type: Boolean
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
    default: 0
  },

  // when transaction with on_us transaction, this is the other party username
  // TODO: refactor, define username as a type so that every property that should be an username can inherit from those parameters
  username: {
    type: String,
    match: [/(?!^(1|3|bc1|lnbc1))^[0-9a-z_]+$/i, "Username can only have alphabets, numbers and underscores"],
    minlength: 3,
    maxlength: 50,
  },

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
    ref: "Medici_Journal"
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  voided: {
    type: Boolean,
    default: false
  },
  void_reason: String,
  // The journal that this is voiding, if any
  _original_journal: Schema.Types.ObjectId,
  approved: {
    type: Boolean,
    default: true
  }
})

//indexes used by our queries
transactionSchema.index({ "type": 1, "pending": 1, "account_path": 1 });
transactionSchema.index({ "account_path": 1 });
transactionSchema.index({ "hash": 1 })

//indexes used by medici internally, and also set by default
//we are setting them here manually because we are using a custom schema
transactionSchema.index({ "_journal": 1 })
transactionSchema.index({ "accounts": 1, "book": 1, "approved": 1, "datetime": -1, "timestamp": -1 });
transactionSchema.index({ "account_path.0": 1, book: 1, approved: 1 });
transactionSchema.index({ "account_path.0": 1, "account_path.1": 1, book: 1, approved: 1 });
transactionSchema.index({ "account_path.0": 1, "account_path.1": 1, "account_path.2": 1, book: 1, approved: 1 });



export const Transaction = mongoose.model("Medici_Transaction", transactionSchema);



const priceSchema = new Schema({
  // TODO:
  // split array in days instead of one big array. 
  // More background here: 
  // https://www.mongodb.com/blog/post/time-series-data-and-mongodb-part-2-schema-design-best-practices
  _id: {
    type: Date, // TODO does _id would prevent having several key (ie: Date) for other exchanges?
    unique: true
  },
  o: Number, // opening price
})

// price History
const priceHistorySchema = new Schema({
  pair: {
    name: {
      type: String,
      enum: ["BTC/USD"]
    },
    exchange: {
      name: {
        type: String,
        // enum: ["kraken"], // others
      },
      price: [priceSchema],
    }
  }
})

export const PriceHistory = mongoose.model("PriceHistory", priceHistorySchema);
