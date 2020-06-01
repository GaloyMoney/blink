import { GraphQLServer } from 'graphql-yoga';
import { createUser } from "./db";
import { LightningWalletAuthed } from "./LightningUserWallet";
import { Price } from "./priceImpl";
import { OnboardingEarn } from "./types";
import { requestPhoneCode, login } from "./text"
let path = require("path");


const DEFAULT_USD = {
  currency: "USD",
  balance: 0,
  transactions: [],
  id: "USD",
}

const resolvers = {
  Query: {
    me: async (_, {uid}) => {
      const User = await createUser()
      const user = await User.findOne({_id: uid})
      console.log({user})
      console.log("me")
      return {
        id: uid,
        level: 1,
      }
    },
    wallet: async (_, {uid}) => {
      console.log("is this executed 0?")
      const lightningWallet = new LightningWalletAuthed({uid})

      const btw_wallet = {
        id: "BTC",
        currency: "BTC",
        balance: lightningWallet.getBalance(), // FIXME why a function and not a callback?
        transactions:  lightningWallet.getTransactions()
      }

      return ([btw_wallet,
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
    earnList: async (_, {uid}) => {
      const response: Object[] = []
  
      const User = await createUser()
      const user = await User.findOne({_id: uid})
      const earned = user?.earn || [] 
  
      for (const [id, value] of Object.entries(OnboardingEarn)) {
        response.push({
          id,
          value,
          completed: earned.findIndex(item => item === id) !== -1,
        })
      }
  
      return response
    },
  },
  Mutation: {
    requestPhoneCode: async (_, {phone}) => {
      return {success: requestPhoneCode({phone})}
    },
    login: async (_, {phone, code}) => {
      return {token: login({phone, code})}
    },
    updateUser: async (_, {user}) => {
      // TODO only level for now
      const lightningWallet = new LightningWalletAuthed({uid: user._id})
      const result = await lightningWallet.setLevel({level: 1})
      return {
        id: user._id,
        level: result.level,
      }
    },
    invoice: async (_, {uid}) => {
      const lightningWallet = new LightningWalletAuthed({uid})
      return ({
  
        addInvoice: async ({value, memo}) => {
          try {
            const result = await lightningWallet.addInvoice({value, memo})
            console.log({result})
            return result
          } catch (err) {
            console.warn(err)
            throw err
          }
        },
        updatePendingInvoice: async ({hash}) => {
          try {
            return await lightningWallet.updatePendingInvoice({hash})
          } catch (err) {
            console.warn(err)
            throw err
          }
        },
        payInvoice: async ({invoice}) => {
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
    earnCompleted: async (_, {uid, id}) => {
      try {
        const lightningWallet = new LightningWalletAuthed({uid})
        const success = await lightningWallet.addEarn(id)
        return success
      } catch (err) {
        console.warn(err)
        throw err
      }
    },
    deleteUser: () => {
      // TODO
    }
}}


const server = new GraphQLServer({
  typeDefs: path.join(__dirname, "schema.graphql"), 
  resolvers }
)

const options = {
  endpoint: '/graphql',
}

server.start(options, ({ port }) =>
  console.log(
    `Server started, listening on port ${port} for incoming requests.`,
  ),
)
