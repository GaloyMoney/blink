import { exit } from "process"
import { logger } from "./utils"

const mongoose = require("mongoose");
// mongoose.set("debug", true);

const Schema = mongoose.Schema;

const dbVersionSchema = new Schema({
  version: Number
})
export const DbVersion = mongoose.model("DbVersion", dbVersionSchema)


// expired invoice should be removed from the collection
const invoiceUserSchema = new Schema({
  _id: String, // hash of invoice
  uid: String,
  pending: Boolean,

  // for invoice that are denominated in usd. this is the sats equivalent
  usd: Number, 
  
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
  txid: String,
  fee: Number,
  type: {
    type: String,
    enum: ["invoice", "payment", "onchain_receipt", "fee", "escrow", "on_us", "onchain_payment"]
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

export const upgrade = async () => {
  
  try {
    let dbVersion = await DbVersion.findOne({})

    console.log({dbVersion})

    if (!dbVersion) {
      dbVersion = {version: 0}
    }
  
    logger.info({dbVersion}, "entering upgrade db module version")
  
    if (dbVersion.version === 0) {
      logger.info("all existing wallet should have BTC as currency")
      // this is to enforce the index constraint
      await User.updateMany({}, {$set: {currency: "BTC"}})
      
      logger.info("there needs to have a role: funder")
      await User.findOneAndUpdate({phone: "+1***REMOVED***", currency: "BTC"}, {role: "funder"})
  
      logger.info("earn is no longer a particular type. replace with on_us")
      await Transaction.updateMany({type: "earn"}, {$set: {type: "on_us"}})
      
      logger.info("setting db version to 1")
      await DbVersion.findOneAndUpdate({}, {version: 1}, {upsert: true})

      logger.info("upgrade succesful to version 1")

    } else {
      logger.info("no need to upgrade the db")
    }
  } catch (err) {
    logger.error({err}, "db upgrade error. exiting")
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
    console.error(`error connecting to mongodb ${err}`)
    exit(1)
  }
}

import { book } from "medici";
export const MainBook = new book("MainBook")