import { DbVersion, setupMongoConnection, upgrade, User } from "./mongodb"

import dotenv from "dotenv";
import { rule, shield } from 'graphql-shield';
import { GraphQLServer } from 'graphql-yoga';
import { ContextParameters } from 'graphql-yoga/dist/types';
import * as jwt from 'jsonwebtoken';
import { Price } from "./priceImpl";
import { login, requestPhoneCode } from "./text";
import { OnboardingEarn } from "./types";
import { AdminWallet } from "./AdminWallet";
import { sendNotification } from "./notification"
import { baseLogger } from "./utils"
import moment from "moment";
import { WalletFactory } from "./walletFactory";

const path = require("path");
dotenv.config()

const pino = require('pino-http')({
  baseLogger,
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
const helmRevision = process.env.HELMREVISION
const getMinBuildNumber = async () => {
  const { minBuildNumber } = await DbVersion.findOne({}, {minBuildNumber: 1, _id: 0})
  return minBuildNumber 
}

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
      const btc_wallet = {
        id: "BTC",
        currency: "BTC",
        balance: lightningWallet.getBalance(), // FIXME why a function and not a callback?
        transactions: lightningWallet.getTransactions()
      }

      return ([
        btc_wallet,
        DEFAULT_USD
      ])
    },
    buildParameters: () => ({
      commitHash: () => commitHash, 
      buildTime: () => buildTime, 
      helmRevision: () => helmRevision,
      minBuildNumberAndroid: getMinBuildNumber,
      minBuildNumberIos: getMinBuildNumber,
    }),
    prices: async (_, __, {logger}) => {
      const price = new Price({logger})
      return await price.lastCached()
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
    getLastOnChainAddress: async (_, __, { lightningWallet }) => ({id: lightningWallet.getLastOnChainAddress()}),
  },
  Mutation: {
    requestPhoneCode: async (_, { phone }, { logger }) => ({ success: requestPhoneCode({ phone, logger }) }),
    login: async (_, { phone, code, currency }, { logger }) => ({ token: login({ phone, code, currency, logger }) }),
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
    invoice: async (_, __, { lightningWallet }) => ({
      addInvoice: async ({ value, memo }) => lightningWallet.addInvoice({ value, memo }),
      updatePendingInvoice: async ({ hash }) => lightningWallet.updatePendingInvoice({ hash }),
      payInvoice: async ({ invoice, amount, memo }) => lightningWallet.pay({ invoice, amount, memo })
    }),
    earnCompleted: async (_, { ids }, { lightningWallet }) => lightningWallet.addEarn(ids),
    deleteUser: () => {
      // TODO
    },
    onchain: async (_, __, { lightningWallet }) => ({
      getNewAddress: () => lightningWallet.getOnChainAddress(),
      pay: ({address, amount, memo}) => ({success: lightningWallet.onChainPay({address, amount, memo})}),
      getFee: ({address}) => lightningWallet.getOnchainFee({address}),
    }),
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
    const uid = token?.uid ?? null
    const logger = baseLogger.child({uid, module: "graphql", body: req.request.body})
    const lightningWallet = !!token ? WalletFactory({...token, logger}) : null
    return {
      ...req,
      logger,
      uid,
      lightningWallet,
    }
  }
})

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
    upgrade().then(() => {
      server.start(options, ({ port }) =>
        baseLogger.info(
          `Server started, listening on port ${port} for incoming requests.`,
        ),
      )
  })}).catch((err) => baseLogger.error(err, "server error"))

