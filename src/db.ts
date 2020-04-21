const mongoose = require("mongoose");
// mongoose.set("debug", true);

const address = process.env.MONGODB_ADDRESS 
const user = process.env.MONGODB_USER
const password = process.env.MONGODB_ROOT_PASSWORD
const db = process.env.MONGODB_DATABASE ?? "galoy"

export const setupMongoose = async () => {
  const path = `mongodb://${user}:${password}@${address}/${db}`

  // await mongoose.connect(`mongodb://root:${password}@${address}/admin`, {
  await mongoose.connect(path, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
  })
}

export const createMainBook = async () => {
  await setupMongoose()

  const Schema = mongoose.Schema;
  const transactionSchema = new Schema({
    currency: String, 
      // typing possible? only "USD", "BTC"
      // use https://mongoosejs.com/docs/api.html#schematype_SchemaType-set ?
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
  try {
    mongoose.model("Medici_Transaction", transactionSchema);
  } catch (error) {
    console.log('OverwriteModelError: Cannot overwrite `Medici_Transaction` model once compiled.')
    console.log('should happen only during testing')
  }

  // should be done after previous line?
  const { book } = require("medici")
  return new book("MainBook")
}
