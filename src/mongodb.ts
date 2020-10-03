import { exit } from "process"
import { logger } from "./utils"

const mongoose = require("mongoose");
// mongoose.set("debug", true);

const Schema = mongoose.Schema;

const dbVersionSchema = new Schema({
  version: Number,
  minBuildNumber: Number,
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
})

// TOOD create indexes

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
    enum: ["user", "admin", "funder", "broker"],
    required: true,
    default: "user"
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
      "invoice", "payment", "on_us", // lightning
      "onchain_receipt", "onchain_payment", "onchain_on_us", // onchain
      "fee", "escrow", // channel-related
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

// TODO indexes, see https://github.com/koresar/medici/blob/master/src/index.js#L39
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

const journalSchema = new Schema({
  datetime: Date,
  memo: {
    type: String,
    default: ""
  },
  _transactions: [
    {
      type: Schema.Types.ObjectId,
      ref: "Medici_Transaction"
    }
  ],
  book: String,
  voided: {
    type: Boolean,
    default: false
  },
  void_reason: String,
  approved: {
    type: Boolean,
    default: true
  }
});

export const Journal = mongoose.model("Medici_Journal", journalSchema)

export const upgrade = async () => {

  try {

    let dbVersion = await DbVersion.findOne({})

    if (!dbVersion) {
      dbVersion = DbVersion.create()
      dbVersion.version = 0
    }

    logger.info({ dbVersion }, "entering upgrade db module version")

    switch (dbVersion.version) {
      case 0:
        logger.info("starting upgrade to version 1")

        logger.info("all existing wallet should have BTC as currency")
        // this is to enforce the index constraint
        await User.updateMany({}, { $set: { currency: "BTC" } })

        logger.info("there needs to have a role: funder")
        await User.findOneAndUpdate({ phone: "+1***REMOVED***", currency: "BTC" }, { role: "funder" })

        logger.info("earn is no longer a particular type. replace with on_us")
        await Transaction.updateMany({ type: "earn" }, { $set: { type: "on_us" } })

        logger.info("setting db version to 1")
        await DbVersion.findOneAndUpdate({}, { version: 1 }, { upsert: true })

        logger.info("upgrade successful to version 1")

      case 1:
        logger.info("starting upgrade to version 2")

        let priceTime
        const moment = require('moment');

        let price
        let skipUpdate = false

        try {
          ({ pair: { exchange: { price } } } = await PriceHistory.findOne({}, {}, { sort: { _id: 1 } }))
        } catch (err) {
          logger.warn("no price available. would only ok if no transaction is available, ie: on devnet")
          const count = await Transaction.countDocuments()
          if (count === 0) {
            skipUpdate = true
          } else {
            exit()
          }
        }

        if (!skipUpdate) {
          const priceMapping = mapValues(keyBy(price, i => moment(i._id)), 'o')
          const lastPriceObj = last(price)
          const lastPrice = (lastPriceObj as any).o

          const transactions = await Transaction.find({})

          for (const tx of transactions) {
            const txTime = moment(tx.datetime).startOf('hour');

            if (has(priceMapping, `${txTime}`)) {
              priceTime = priceMapping[`${txTime}`]
            } else {
              logger.warn({ tx }, 'using most recent price for time %o', `${txTime}`)
              priceTime = lastPrice
            }

            const usd = (tx.debit + tx.credit) * priceTime
            await Transaction.findOneAndUpdate({ _id: tx._id }, { usd })
          }
        }

        logger.info("setting db version to 2")
        dbVersion.version = 2
        dbVersion.minBuildNumber = 182
        await dbVersion.save()

        logger.info("upgrade successful to version 2")

      case 2:
        logger.info("starting upgrade to version 3")

        const memo = 'escrow'
        await Transaction.remove({ memo })
        await Journal.remove({ memo })

        dbVersion.version = 2
        await dbVersion.save()

        logger.info("upgrade successful to version 3")

      default:
        logger.info("db was just upgraded or did not need upgrade")
        break;
    }
  } catch (err) {
    logger.fatal({ err }, "db upgrade error. exiting")
    exit()
  }
}


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
  } catch (err) {
    logger.error(`error connecting to mongodb ${err}`)
    exit(1)
  }
}

import { book } from "medici";
import { has, keyBy, last, map, mapValues } from "lodash";
export const MainBook = new book("MainBook")