import dotenv from "dotenv";
import { rule, shield } from 'graphql-shield';
import { GraphQLServer } from 'graphql-yoga';
import * as jwt from 'jsonwebtoken';
import moment from "moment";
import { AdminWallet } from "./AdminWallet";
import { DbVersion, setupMongoConnection, User } from "./mongodb";
import { sendNotification } from "./notification";
import { Price } from "./priceImpl";
import { login, requestPhoneCode } from "./text";
import { OnboardingEarn } from "./types";
import { baseLogger, customLoggerPrefix, getAuth, nodeStats } from "./utils";
import { WalletFactory } from "./walletFactory";
import { v4 as uuidv4 } from 'uuid';
import { startsWith } from "lodash";
import { upgrade } from "./upgrade"
const util = require('util')
const lnService = require('ln-service')


const path = require("path");
dotenv.config()

const graphqlLogger = baseLogger.child({module: "graphql"})
const pino = require('pino')

const pino_http = require('pino-http')({
  logger: graphqlLogger,
  wrapSerializers: false,
  
  // Define custom serializers
  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: (res) => ({
      // FIXME: kind of a hack. body should be in in req. but have not being able to do it.
      body: res.req.body,
      ...pino.stdSerializers.res(res)
    })
  },
  reqCustomProps: function (req) {
    return {
      // FIXME: duplicate parsing from graphql context.
      token: verifyToken(req)
    }
  },
  autoLogging: {
    ignorePaths: ["/healthz"]
  }
})

const { lnd } = lnService.authenticatedLndGrpc(getAuth())

const commitHash = process.env.COMMITHASH
const buildTime = process.env.BUILDTIME
const helmRevision = process.env.HELMREVISION
const getMinBuildNumber = async () => {
  const { minBuildNumber } = await DbVersion.findOne({}, { minBuildNumber: 1, _id: 0 })
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
    nodeStats: async() => nodeStats({lnd}),
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
    getLastOnChainAddress: async (_, __, { lightningWallet }) => ({ id: lightningWallet.getLastOnChainAddress() }),
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
    publicInvoice: async (_, { uid, logger }) => {
      const lightningWallet = WalletFactory({ uid, currency: 'BTC', logger })
      return {
        addInvoice: async ({ value, memo }) => lightningWallet.addInvoice({ value, memo, selfGenerated: false }),
        updatePendingInvoice: async ({ hash }) => lightningWallet.updatePendingInvoice({ hash })
      }
    },
    openChannel: async (_, { local_tokens, public_key, socket }, { }) => {
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
      pay: ({ address, amount, memo }) => ({ success: lightningWallet.onChainPay({ address, amount, memo }) }),
      getFee: ({ address }) => lightningWallet.getOnchainFee({ address }),
    }),
    addDeviceToken: async (_, { deviceToken }, { uid }) => {
      // TODO: refactor to a higher level User class
      const user = await User.findOne({ _id: uid })
      user.deviceToken.addToSet(deviceToken)
      await user.save()
      return { success: true }
    },

    // FIXME test
    testMessage: async (_, __, { uid, logger }) => {
      // throw new LoggedError("test error")
      await sendNotification({
          uid, 
          title: "Title", 
          body: `New message sent at ${moment.utc().format('YYYY-MM-DD HH:mm:ss')}`,
          logger
        })
      return {success: true}
    },
  }
}


function verifyToken(req) {

  let token
  try {
    const auth = req.get('Authorization')

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
  context: async (context) => {
    const token = verifyToken(context.request)
    const uid = token?.uid ?? null
    // @ts-ignore
    const logger = graphqlLogger.child({token, id: context.request.id, body: context.request.body})
    const lightningWallet = !!token ? WalletFactory({...token, logger}) : null
    return {
      ...context,
      logger,
      uid,
      lightningWallet,
    }
  }
})

// injecting unique id to the request for correlating different logs messages
server.express.use(function (req, res, next) {
  // @ts-ignore
  req.id = uuidv4();
  next();
});

server.express.use(pino_http)


// Health check
server.express.get('/healthz', function(req, res) {
  res.send('OK');
});

const options = {
  // tracing: true,
  formatError: err => {
    if (!(startsWith(err.message, customLoggerPrefix))) {
      baseLogger.error({err}, "graphql catch-all error"); 
    }
    // return defaultErrorFormatter(err)
    return err
  },
  endpoint: '/graphql',
  playground: process.env.NETWORK === 'mainnet' ? 'false' : '/'
}

setupMongoConnection()
  .then(() => {
    upgrade().then(() => {
      server.start(options, ({ port }) =>
        graphqlLogger.info(
          `Server started, listening on port ${port} for incoming requests.`,
        ),
      )
  })}).catch((err) => graphqlLogger.error(err, "server error"))

