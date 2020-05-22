import { graphql, buildSchema } from "graphql"
import { LightningWalletAuthed } from "./LightningUserWallet";
const express = require("express")
const graphqlHTTP = require("express-graphql")
import { Price } from "./priceImpl";
let fs = require("fs-extra");
let path = require("path");


// Construct a schema, using GraphQL schema language
const schema_string = fs.readFileSync(path.join(__dirname, "schema.graphql"), "utf8");
const schema = buildSchema(schema_string);


let lightningWallet

// The root provides a resolver function for each API endpoint
const root = {
  btcWallet: async ({uid}) => {
    lightningWallet = new LightningWalletAuthed({uid})
    return ({
      balance: () => {
        return lightningWallet.getBalance()
      },
      transactions: async () => {
        try {
          lightningWallet = new LightningWalletAuthed({uid})
          return lightningWallet.getTransactions()
        } catch (err) {
          console.warn(err)
        }
      },
    })
  },
  prices: async () => {
    try {
      const price = new Price()
      const lastPrices = await price.lastCached()
      console.log({lastPrices})
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
