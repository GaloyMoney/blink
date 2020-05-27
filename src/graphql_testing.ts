import { graphql, buildSchema } from "graphql"
import { LightningWalletAuthed } from "./LightningUserWallet";
const express = require("express")
const graphqlHTTP = require("express-graphql")
import { Price } from "./priceImpl";
let fs = require("fs-extra");
let path = require("path");
import { createUser } from "./db"


// Construct a schema, using GraphQL schema language
const schema_string = fs.readFileSync(path.join(__dirname, "schema.graphql"), "utf8");
const schema = buildSchema(schema_string);


let lightningWallet

const DEFAULT_USD = {
  currency: "USD",
  balance: 0,
  transactions: [],
  id: "USD",
}

// The root provides a resolver function for each API endpoint
const root = {
  me: async ({uid}) => {
    const User = await createUser()
    const user = await User.findOne({_id: uid})
    console.log({user})
    console.log("me")
    return {
      id: uid,
      level: 1,
    }
  },
  updateUser: async ({user}) => {
    // TODO only level for now
    lightningWallet = new LightningWalletAuthed({uid: user._id})
    const result = await lightningWallet.setLevel({level: 1})
    return {
      id: user._id,
      level: result.level,
    }
  },
  wallet: async ({uid}) => {
    lightningWallet = new LightningWalletAuthed({uid})
    return ([{
      id: "BTC",
      currency: "BTC",
      balance: () => {
        return lightningWallet.getBalance()
      },
      transactions: async () => {
        try {
          return lightningWallet.getTransactions()
        } catch (err) {
          console.warn(err)
        }
      },
    },
      DEFAULT_USD]
    )
  },
  prices: async () => {
    try {
      const price = new Price()
      const lastPrices = await price.lastCached()
      return lastPrices
    } catch (err) {
      console.warn(err)
      throw err
    }
  },

  invoice: async ({uid}) => {
    lightningWallet = new LightningWalletAuthed({uid})
    return ({

      addInvoice: async ({value, memo, uid}) => {
        try {
          const result = await lightningWallet.addInvoice({value, memo})
          console.log({result})
          return result
        } catch (err) {
          console.warn(err)
          throw err
        }
      },
      updatePendingInvoice: async ({hash, uid}) => {
        try {
          return await lightningWallet.updatePendingInvoice({hash})
        } catch (err) {
          console.warn(err)
          throw err
        }
      },
      payInvoice: async ({invoice, uid}) => {
        try {
          const success = await lightningWallet.payInvoice({invoice})
          console.log({success})
          return success
        } catch (err) {
          console.warn(err)
          throw err
        }
      },
  })},

  earnList: async () => {
    // TODO
  },
  earnMutation: async ({uid}) => {
    return ({
      add: async ({snapshot}) => {
        try {
          lightningWallet = new LightningWalletAuthed({uid})
          const success = await lightningWallet.addEarn(snapshot)
          return success
        } catch (err) {
          console.warn(err)
          throw err
        }
      }
  })}
};

const app = express()
app.use('/graphql', graphqlHTTP({
  schema: schema,
  rootValue: root,
  graphiql: true
}))
app.listen(4000)
console.log("now running... http://localhost:4000/graphql ")
