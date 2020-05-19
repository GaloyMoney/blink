import { graphql, buildSchema } from "graphql"
import { LightningWalletAuthed } from "./LightningUserWallet";
const express = require("express")
const graphqlHTTP = require("express-graphql")
import { Price } from "./priceImpl";

// Construct a schema, using GraphQL schema language
const schema = buildSchema(`
  type Transaction {
    amount: Int!,
    description: String!,
    created_at: String!,
    hash: String,
    type: String!,
  }

  type Price {
    t: Int
    o: Float
  }

  type Query {
    prices: [Price]
    balance(uid: String): String
    transactions(uid: String): [Transaction]
  }
`);

let lightningWallet

// The root provides a resolver function for each API endpoint
const root = {
  balance: ({uid}) => {
    lightningWallet = new LightningWalletAuthed({uid})
    return lightningWallet.getBalance()
  },
  transactions: async ({uid}) => {
    try {
      lightningWallet = new LightningWalletAuthed({uid})
      return lightningWallet.getTransactions()
    } catch (err) {
      console.warn(err)
    }
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
  }
};

const app = express()
app.use('/graphql', graphqlHTTP({
  schema: schema,
  rootValue: root,
  graphiql: true
}))
app.listen(4000)
console.log("now running...")