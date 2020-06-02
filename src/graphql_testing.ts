import { rule, shield } from 'graphql-shield';
import { GraphQLServer } from 'graphql-yoga';
import { ContextParameters } from 'graphql-yoga/dist/types';
import * as jwt from 'jsonwebtoken';
import { JWT_SECRET } from "./const";
import { createUser, setupMongoose } from "./db";
import { LightningWalletAuthed } from "./LightningUserWallet";
import { Price } from "./priceImpl";
import { login, requestPhoneCode } from "./text";
import { OnboardingEarn } from "./types";
let path = require("path");


const DEFAULT_USD = {
  currency: "USD",
  balance: 0,
  transactions: [],
  id: "USD",
}

const resolvers = {
  Query: {
    me: async (_, __, {uid}) => {
      const User = await createUser()
      const user = await User.findOne({_id: uid})
      console.log({user})
      console.log("me")
      return {
        id: uid,
        level: 1,
      }
    },
    wallet: async (_, __, {uid}) => {
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
    earnList: async (_, __, {uid}) => {
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
      // FIXME manage uid
      // TODO only level for now
      const lightningWallet = new LightningWalletAuthed({uid: user._id})
      const result = await lightningWallet.setLevel({level: 1})
      return {
        id: user._id,
        level: result.level,
      }
    },
    invoice: async (_, __, {uid}) => {
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
    earnCompleted: async (_, {id}, {uid}) => {
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

function getUid(ctx: ContextParameters) {
  
  let token
  try {
    const auth = ctx.request.get('Authorization')

    if (!auth) {
      return null
    }

    if (auth.split(" ")[0] !== "Bearer") {
      throw Error("not a bearer token")
    }
  
    const raw_token = auth.split(" ")[1]
    console.log(raw_token)

    token = jwt.verify(raw_token, JWT_SECRET);
    console.log({token})

    // TODO assert bitcoin network
  } catch (err) {
    return null
    // TODO return new AuthenticationError("Not authorised"); ?
    // ie: differenciate between non authenticated, and not authorized
  }

  return token.uid
}

const isAuthenticated = rule({ cache: 'contextual' })(
  async (parent, args, ctx, info) => {
    return ctx.uid !== null
  },
)

const permissions = shield({
  Query: {
    // prices: not(isAuthenticated),
    // earnList: isAuthenticated,
    wallet: isAuthenticated,
    me: isAuthenticated,
  },
  Mutation: {
    // requestPhoneCode: not(isAuthenticated),
    // login: not(isAuthenticated),
  
    invoice: isAuthenticated,
    earnCompleted: isAuthenticated,
    updateUser: isAuthenticated,
    deleteUser: isAuthenticated,
  },
})

const server = new GraphQLServer({
  typeDefs: path.join(__dirname, "schema.graphql"), 
  resolvers,
  middlewares: [permissions],
  context: async (req) => {
    await setupMongoose() // workaround on the issue of `verwriteModelError: Cannot overwrite `InvoiceUser` model once compiled`
    const result = {
      ...req,
      uid: getUid(req)
    }
    return result
  }
 })

const options = {
  endpoint: '/graphql',
}

server.start(options, ({ port }) =>
  console.log(
    `Server started, listening on port ${port} for incoming requests.`,
  ),
)
