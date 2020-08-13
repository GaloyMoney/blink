import { setupMongoConnection, User } from "./mongodb"
// this import needs to be before medici

import dotenv from "dotenv";
import { rule, shield } from 'graphql-shield';
import { GraphQLServer } from 'graphql-yoga';
import { ContextParameters } from 'graphql-yoga/dist/types';
import * as jwt from 'jsonwebtoken';
import { LightningUserWallet } from "./LightningUserWallet";
import { Price } from "./priceImpl";
import { login, requestPhoneCode } from "./text";
import { OnboardingEarn } from "./types";
import { LightningAdminWallet } from "./LightningAdminImpl";
const path = require("path");
const mongoose = require("mongoose");
dotenv.config()

import { logger } from "./utils"
const pino = require('pino-http')({
  logger,
  // TODO: get uid and other information from the request.
  // tried https://github.com/addityasingh/graphql-pino-middleware without success
  // Define additional custom request properties
  // reqCustomProps: function (req) {
  //   console.log({req})
  //   return {
  //     // uid: req.uid
  //   }
  // }
  autoLogging: {
    ignorePaths: ["/healthz"]
  }
})

const commitHash = process.env.COMMITHASH
const buildTime = process.env.BUILDTIME

const DEFAULT_USD = {
  currency: "USD",
  balance: 0,
  transactions: [],
  id: "USD",
}

const resolvers = {
  Query: {
    me: async (_, __, { uid }) => {
      const user = await User.findOne({ _id: uid })

      return {
        id: uid,
        level: 1,
      }
    },
    wallet: async (_, __, { uid }) => {
      const lightningWallet = new LightningUserWallet({ uid })

      const btw_wallet = {
        id: "BTC",
        currency: "BTC",
        balance: lightningWallet.getBalance(), // FIXME why a function and not a callback?
        transactions: lightningWallet.getTransactions()
      }

      return ([btw_wallet,
        DEFAULT_USD]
      )
    },
    buildParameters: async () => {
      try {
        return { commitHash, buildTime }
      } catch (err) {
        logger.warn(err)
        throw err
      }
    },
    pendingOnChainPayment: async (_, __, { uid }) => {
      const lightningWallet = new LightningUserWallet({ uid })
      return await lightningWallet.getPendingIncomingOnchainPayments()
    },
    prices: async () => {
      try {
        const price = new Price()
        const lastPrices = await price.lastCached()
        return lastPrices
      } catch (err) {
        logger.warn(err)
        throw err
      }
    },
    earnList: async (_, __, { uid }) => {
      const response: Object[] = []

      const user = await User.findOne({ _id: uid })
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
    getLastOnChainAddress: async (_, __, {uid}) => {
      const lightningWallet = new LightningUserWallet({uid})
      const getLastAddress = await lightningWallet.getLastOnChainAddress()
      return {id: getLastAddress}
    }
  },
  Mutation: {
    requestPhoneCode: async (_, { phone }) => {
      return { success: requestPhoneCode({ phone }) }
    },
    login: async (_, { phone, code }) => {
      return { token: login({ phone, code }) }
    },
    updateUser: async (_, { user }) => {
      // FIXME manage uid
      // TODO only level for now
      const lightningWallet = new LightningUserWallet({ uid: user._id })
      const result = await lightningWallet.setLevel({ level: 1 })
      return {
        id: user._id,
        level: result.level,
      }
    },
    openChannel: async (_, { local_tokens, public_key, socket }, { uid }) => {
      const lightningAdminWallet = new LightningAdminWallet({ uid })
      return { tx: lightningAdminWallet.openChannel({ local_tokens, public_key, socket }) }
    },
    invoice: async (_, __, { uid }) => {
      const lightningWallet = new LightningUserWallet({ uid })
      return ({

        addInvoice: async ({ value, memo }) => {
          try {
            const result = await lightningWallet.addInvoice({ value, memo })
            return result
          } catch (err) {
            logger.error(err)
            throw err
          }
        },
        updatePendingInvoice: async ({ hash }) => {
          try {
            return await lightningWallet.updatePendingInvoice({ hash })
          } catch (err) {
            logger.error(err)
            throw err
          }
        },
        payInvoice: async ({ invoice, amount }) => {
          try {
            const success = await lightningWallet.pay({ invoice, amount })
            logger.debug({ success }, "succesful payment for user %o", { uid })
            return success
          } catch (err) {
            logger.error({ err }, "lightning payment error")
            throw err
          }
        },

      })
    },
    earnCompleted: async (_, { ids }, { uid }) => {
      try {
        logger.debug({ uid }, "request earnComplete for user %o", { uid })
        const lightningWallet = new LightningUserWallet({ uid })
        const success = await lightningWallet.addEarn(ids)
        return success
      } catch (err) {
        logger.warn(err)
        throw err
      }
    },
    deleteUser: () => {
      // TODO
    },
    onchain: async (_, __, { uid }) => {
      const lightningWallet = new LightningUserWallet({uid})
      const getNewAddress = await lightningWallet.getOnChainAddress()
      return {getNewAddress}
    }
  }
}


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
    token = jwt.verify(raw_token, process.env.JWT_SECRET);

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
    pendingOnChainPayment: isAuthenticated
  },
  Mutation: {
    // requestPhoneCode: not(isAuthenticated),
    // login: not(isAuthenticated),

    openChannel: isAuthenticated, // FIXME: this should be isAuthenticated && isAdmin

    onchain: isAuthenticated,
    invoice: isAuthenticated,
    earnCompleted: isAuthenticated,
    updateUser: isAuthenticated,
    deleteUser: isAuthenticated,
  },
}, { allowExternalErrors: true }) // TODO remove to not expose internal error


const server = new GraphQLServer({
  typeDefs: path.join(__dirname, "schema.graphql"),
  resolvers,
  middlewares: [permissions],
  context: async (req) => {
    const result = {
      ...req,
      uid: getUid(req)
    }
    return result
  }
})

//TODO: set logger level instead of not calling next
// https://github.com/pinojs/pino/issues/713
// server.express.use((req, res, next) => {
//   const userAgent = req.get('User-Agent')
//   if (userAgent?.split('/')[0] == 'GoogleHC') {
//     next()
//   } else {
//     return
//   }
// })

server.express.use(pino)


// Health check
server.express.get('/healthz', function(req, res) {
  res.send('OK');
});

const options = {
  endpoint: '/graphql',
  playground: process.env.NETWORK === 'mainnet' ? 'false': '/'
}

setupMongoConnection()
  .then(() => {
    server.start(options, ({ port }) =>
      logger.info(
        `Server started, listening on port ${port} for incoming requests.`,
      ),
    )
  }).catch((err) => logger.error(err, "server error"))

