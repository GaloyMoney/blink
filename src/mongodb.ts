import { exit } from "process"
import { baseLogger } from "./utils"

const mongoose = require("mongoose");
// mongoose.set("debug", true);

const Schema = mongoose.Schema;

const pointSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Point'],
    required: true
  },
  coordinates: {
    type: [Number],
    required: true
  }
});


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

  username: String,

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
  },

  cashback: {
    type: Boolean,
    default: false
  }
})

invoiceUserSchema.index({ "uid": 1 })


export const InvoiceUser = mongoose.model("InvoiceUser", invoiceUserSchema)

export const regexUsername = /(?!^(1|3|bc1|lnbc1))^[0-9a-z_]+$/i



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
    enum: ["user", "broker"],
    required: true,
    default: "user"
    // todo : enfore the fact there can be only one broker
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
  currency: {
    type: String,
    enum: ["USD", "BTC"],
    default: "BTC",
    required: true,
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
    enum: ["en", "es", null],
    default: null // will use OS preference settings
  },
  // firstName,
  // lastName,
  // activated,
  // etc

  title: String,
  coordinate: {
    type: pointSchema,
  },
  excludeCashback: {
    type: Boolean,
    default: false
  }

})

UserSchema.index({
  phone: 1,
  currency: 1,
}, {
  unique: true,
});

UserSchema.index({
  title: 1,
  coordinate: 1,
});


UserSchema.statics.findByUsername = async function ({ username }) {
  if (typeof username !== "string" || !username.match(regexUsername)) {
    return null
  }

  return this.findOne({ username: new RegExp(`^${username}$`, 'i') })
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


const FaucetSchema = new Schema({
  created_at: {
    type: Date,
    default: Date.now
  },
  hash: {
    type: String,
    required: true
  },
  used: {
    type: Boolean,
    default: false
  },
  message: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: "BTC"
  }
})

export const Faucet = mongoose.model("Faucet", FaucetSchema)


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
    required: true,
    type: String,
    enum: [
      // TODO: merge with the Interface located in types.ts?
      "invoice", "payment", "on_us", "fee_reimbursement", // lightning
      "onchain_receipt", "onchain_payment", "onchain_on_us", // onchain
      "fee", "escrow", // channel-related
      "exchange_rebalance"//
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
    await User.syncIndexes()
    await Transaction.syncIndexes()
    await InvoiceUser.syncIndexes()
  } catch (err) {
    baseLogger.fatal({ err }, `error connecting to mongodb`)
    exit(1)
  }
}

import { book } from "medici";
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
