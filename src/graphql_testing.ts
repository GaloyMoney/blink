import { graphql, buildSchema } from "graphql"
import { LightningWalletAuthed } from "./LightningUserWallet";
const express = require("express")
const graphqlHTTP = require("express-graphql")
import { Price } from "./priceImpl";

// Construct a schema, using GraphQL schema language
const schema = buildSchema(`
  type Transaction {
    t: Int
    v: Float
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
  transactions: ({uid}) => {
    lightningWallet = new LightningWalletAuthed({uid})
    return lightningWallet.getTransactions()
  },
  prices: () => {
    const price = new Price()
    return price.lastCached()
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