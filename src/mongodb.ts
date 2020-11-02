import { exit } from "process"
import { baseLogger } from "./utils"

const mongoose = require("mongoose");
// mongoose.set("debug", true);

const Schema = mongoose.Schema;

const dbVersionSchema = new Schema({
  version: Number,
  minBuildNumber: Number,
  lastBuildNumber: Number,
})
export const DbVersion = mongoose.model("DbVersion", dbVersionSchema)


// expired invoice should be removed from the collection
const invoiceUserSchema = new Schema({
  _id: String, // hash of invoice
  uid: String,
  pending: Boolean,

  // usd equivalent. sats is attached in the invoice directly.
  // optional, as BTC wallet doesn't have to set a sat amount when creating the invoice
  usd: Number,

  // currency matchs the user account
  currency: {
    type: String,
    enum: ["USD", "BTC"],
    default: "BTC",
  },

  timestamp: {
    type: Date,
    default: Date.now
  },

  selfGenerated: {
    type: Boolean,
    default: true
  }
})

// TOOD create indexes
invoiceUserSchema.index({ pending: 1, uid: 1 })

export const InvoiceUser = mongoose.model("InvoiceUser", invoiceUserSchema)

const UserSchema = new Schema({
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
    enum: ["user", "funder", "broker"], // FIXME: "admin" is not used anymore --> remove?
    required: true,
    default: "user"
    // doto : enfore the fact there can be only one funder/broker
  },
  onchain_addresses: {
    type: [String],
    default: []
  },
  level: {
    type: Number,
    default: 1
  },
  phone: { // TODO we should store country as a separate string
    type: String,
    required: true,
  },
  username: {
    type: String,
    match: [/^[0-9a-z_]+$/i, "Username can only have alphabets, numbers and underscores"],
    minlength: 3,
    maxlength: 50,
    index: {
      unique: true,
      partialFilterExpression: { username: { $type: "string" } }
    }
  },
  deviceToken: {
    type: [String],
    default: []
  },
  currency: {
    type: String,
    enum: ["USD", "BTC"],
    default: "BTC",
    required: true,
  },
  // firstName,
  // lastName,
  // activated,
  // etc
})

UserSchema.index({
  phone: 1,
  currency: 1,
}, {
  unique: true,
});

// TOOD create indexes

export const User = mongoose.model("User", UserSchema)


// TODO: this DB should be capped.
const PhoneCodeSchema = new Schema({
  created_at: {
    type: Date,
    default: Date.now
  },
  phone: Number,
  code: Number,
})

export const PhoneCode = mongoose.model("PhoneCode", PhoneCodeSchema)


const transactionSchema = new Schema({

  hash: {
    type: Schema.Types.String,
    ref: 'InvoiceUser'
    // TODO: not always, use another hashOnchain?

    // required: function() {
    //   return this.currency === "BTC"
    //   a ref only for Invoice. otherwise the hash is not linked
    // }
  },

  // used for escrow transaction, to know which channel this transaction is associated with
  // FIXME? hash is currently used for onchain tx but txid should be used instead?
  // an onchain output is deterministically represented by hash of tx + vout
  txid: String,

  type: {
    type: String,
    enum: [
      // TODO: merge with the Interface located in types.ts?
      "invoice", "payment", "on_us", // lightning
      "onchain_receipt", "onchain_payment", "onchain_on_us", // onchain
      "fee", "escrow", // channel-related
      "exchange_rebalance"//
    ]
  },
  pending: Boolean, // used to denote confirmation status of on and off chain txn
  err: String,
  currency: {
    // TODO: check if an upgrade is needed for this one
    type: String,
    enum: ["USD", "BTC"],
    default: "BTC",
    required: true
  },

  fee: {
    type: Number,
    default: 0
  },

  memoPayer: String,

  // not used for accounting but used for usd/sats equivalent
  usd: Number,
  sats: Number,
  feeUsd: {
    type: Number,
    default: 0
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

// TODO add an event listenever if we got disconnecter from MongoDb
// after a first succesful connection

export const setupMongoConnection = async () => {
  const user = process.env.MONGODB_USER ?? "testGaloy"
  const password = process.env.MONGODB_ROOT_PASSWORD ?? "testGaloy"
  const address = process.env.MONGODB_ADDRESS ?? "mongodb"
  const db = process.env.MONGODB_DATABASE ?? "galoy"

  const path = `mongodb://${user}:${password}@${address}/${db}`

  try {
    await mongoose.connect(path, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false
    })
    mongoose.set('runValidators', true)
  } catch (err) {
    baseLogger.fatal(`error connecting to mongodb ${err}`)
    exit(1)
  }
}

import { book } from "medici";
import { has, keyBy, last, mapValues } from "lodash";
import { createBrokerUid } from "./walletFactory";
export const MainBook = new book("MainBook")


// approach below doesn't work
// find a way to make currency mandatory for balance and ledger

// MainBook.balance = function(_super) {
//   return function() {
//     if (!arguments[0].currency) {
//       throw Error("currency is missing to get the balance")
//     }
//     // @ts-ignore
//     return _super.apply(this, arguments);
//   };
// }

// TODO: .ledger() as well