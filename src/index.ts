import { setupMongoConnection, User } from "./mongodb"

import dotenv from "dotenv";
import { rule, shield } from 'graphql-shield';
import { GraphQLServer } from 'graphql-yoga';
import { ContextParameters } from 'graphql-yoga/dist/types';
import * as jwt from 'jsonwebtoken';
import { Price } from "./priceImpl";
import { login, requestPhoneCode } from "./text";
import { OnboardingEarn } from "./types";
import { AdminWallet } from "./LightningAdminImpl";
import { sendNotification } from "./notification"

const path = require("path");
dotenv.config()


import { logger } from "./utils"
import moment from "moment";
import { WalletFactory } from "./walletFactory";
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
    wallet: async (_, __, { lightningWallet }) => {
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
    pendingOnChainPayment: async (_, __, { lightningWallet }) => {
      return lightningWallet.getPendingIncomingOnchainPayments()
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
    getLastOnChainAddress: async (_, __, { lightningWallet }) => {
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
    updateUser: async (_, __,  { lightningWallet }) => {
      // FIXME manage uid
      // TODO only level for now
      const result = await lightningWallet.setLevel({ level: 1 })
      return {
        id: lightningWallet.uid,
        level: result.level,
      }
    },
    openChannel: async (_, { local_tokens, public_key, socket }, {}) => {
      // FIXME: security risk. remove openChannel from graphql
      const lightningAdminWallet = new AdminWallet()
      return { tx: lightningAdminWallet.openChannel({ local_tokens, public_key, socket }) }
    },
    invoice: async (_, __, { lightningWallet }) => {
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
            logger.debug({ success }, "succesful payment for user %o", lightningWallet.uid)
            return success
          } catch (err) {
            logger.error({ err }, "lightning payment error")
            throw err
          }
        },

      })
    },
    earnCompleted: async (_, { ids }, { lightningWallet }) => {
      return lightningWallet.addEarn(ids)
    },
    deleteUser: () => {
      // TODO
    },
    onchain: async (_, __, { lightningWallet }) => {
      return {
        getNewAddress: () => lightningWallet.getOnChainAddress(),
        pay: ({address, amount}) => ({success: lightningWallet.onChainPay({address, amount})}),
      }
    },
    addDeviceToken: async (_, { deviceToken }, { uid }) => {
      // TODO: refactor to a higher level User class
      const user = await User.findOne({ _id: uid })
      user.deviceToken.addToSet(deviceToken)
      await user.save()
      return {success: true}
    },

    // FIXME test
    testMessage: async (_, __, { uid }) => {
      await sendNotification({uid, title: "Title", body: `New message sent at ${moment.utc().format('YYYY-MM-DD HH:mm:ss')}`})
      return {success: true}
    },
  }
}


function verifyToken(ctx: ContextParameters) {

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
  return token
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
    addDeviceToken: isAuthenticated,
  },
}, { allowExternalErrors: true }) // TODO remove to not expose internal error


const server = new GraphQLServer({
  typeDefs: path.join(__dirname, "schema.graphql"),
  resolvers,
  middlewares: [permissions],
  context: async (req) => {
    const token = verifyToken(req)
    const lightningWallet = await WalletFactory(token)
    const result = {
      ...req,
      uid: token.uid,
      lightningWallet,
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

