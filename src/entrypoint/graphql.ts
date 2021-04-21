import { ApolloServer } from 'apollo-server-express';
import dotenv from "dotenv";
import express from 'express';
import expressJwt from "express-jwt";
import { importSchema } from 'graphql-import';
import { applyMiddleware } from "graphql-middleware";
import { and, rule, shield } from 'graphql-shield';
import { makeExecutableSchema } from "graphql-tools";
import _ from 'lodash';
import moment from "moment";
import mongoose from "mongoose";
import path from "path";
import pino from 'pino';
// https://nodejs.org/api/esm.html#esm_no_require_exports_module_exports_filename_dirname
// TODO: to use when switching to module
// import { fileURLToPath } from 'url';
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
import PinoHttp from "pino-http";
import swStats from 'swagger-stats';
import util from 'util';
import { v4 as uuidv4 } from 'uuid';
import { getMinBuildNumber, getHourlyPrice } from "../localCache";
import { lnd } from "../lndConfig";
import { nodeStats } from "../lndUtils";
import { setupMongoConnection } from "../mongodb";
import { sendNotification } from "../notifications/notification";
import { User } from "../schema";
import { login, requestPhoneCode } from "../text";
import { Levels, OnboardingEarn } from "../types";
import { AdminOps } from "../AdminOps"
import { baseLogger, fetchIPDetails } from "../utils";
import { WalletFactory, WalletFromUsername } from "../walletFactory";
import { getCurrentPrice } from "../realtimePrice";
import { getAsyncRedisClient } from "../redis";
import { yamlConfig } from '../config';

dotenv.config()

const graphqlLogger = baseLogger.child({ module: "graphql" })


const pino_http = PinoHttp({
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
  autoLogging: {
    ignorePaths: ["/healthz"]
  }
})

const commitHash = process.env.COMMITHASH
const buildTime = process.env.BUILDTIME
const helmRevision = process.env.HELMREVISION

const resolvers = {
  Query: {
    me: async (_, __, { uid, user }) => {
      const { phone, username, contacts, language, level } = user

      return {
        id: uid,
        level,
        phone,
        username,
        contacts,
        language
      }
    },

    // legacy, before handling multi currency account
    wallet: async (_, __, { wallet }) => ([{
      id: "BTC",
      currency: "BTC",
      balance: async () => (await wallet.getBalances())["BTC"],
      transactions: () => wallet.getTransactions(),
      csv: () => wallet.getStringCsv()
    }]),

    // new way to return the balance
    // balances are distinc between USD and BTC
    // but transaction are common, because they could have rely both on USD/BTC
    wallet2: async (_, __, { wallet }) => {
      const balances = await wallet.getBalances()

      return {
        transactions: wallet.getTransactions(),
        balances: wallet.user.currencies.map(item => ({
          id: item.id,
          balance: balances[item.id],
        }))
      }
    },
    nodeStats: async () => nodeStats({ lnd }),
    buildParameters: async () => {
      const { minBuildNumber, lastBuildNumber } = await getMinBuildNumber()
      return {
        id: lastBuildNumber,
        commitHash: () => commitHash,
        buildTime: () => buildTime,
        helmRevision: () => helmRevision,
        minBuildNumberAndroid: minBuildNumber,
        minBuildNumberIos: minBuildNumber,
        lastBuildNumberAndroid: lastBuildNumber,
        lastBuildNumberIos: lastBuildNumber,
      }
    },
    prices: async (_, { length = 365 * 24 * 10 }, { logger }) => {
      const hourly = await getHourlyPrice({ logger })

      // adding the current price as the lat index array
      // use by the mobile application to convert prices
      hourly.push({
        id: moment().unix(),
        o: getCurrentPrice()
      })

      return hourly.splice(-length)
    },
    earnList: async (_, __, { uid, user }) => {
      const response: Object[] = []
      const earned = user?.earn || []

      for(const [id, value] of Object.entries(OnboardingEarn)) {
        response.push({
          id,
          value,
          completed: earned.findIndex(item => item === id) !== -1,
        })
      }

      return response
    },
    getLastOnChainAddress: async (_, __, { wallet }) => ({ id: wallet.getLastOnChainAddress() }),
    maps: async () => {
      // TODO: caching
      const users = await User.find(
        { title: { $exists: true }, coordinate: { $exists: true } },
        { username: 1, title: 1, coordinate: 1 }
      );

      return users.map((user) => ({
        ...user._doc,
        id: user.username
      }))
    },
    usernameExists: async (_, { username }) => AdminOps.usernameExists({ username }),
    getUserDetails: async (_, { uid }) => User.findOne({_id: uid}),
    noauthUpdatePendingInvoice: async (_, { hash, username }, { logger }) => {
      const wallet = await WalletFromUsername({ username, logger })
      return wallet.updatePendingInvoice({ hash })
    },
    getUid: async (_, { username, phone }) => {
      const { _id: uid } = await User.getUser({ username, phone })
      return uid
    },
    getLevels: () => Levels,
    getLimits: (_, __, {user}) => {
      return {
        oldEnoughForWithdrawal: yamlConfig.limits.oldEnoughForWithdrawal,
        withdrawal: yamlConfig.limits.withdrawal.level[user.level],
        onUs: yamlConfig.limits.onUs.level[user.level]
      }
    }
  },
  Mutation: {
    requestPhoneCode: async (_, { phone }, { logger }) => ({ success: requestPhoneCode({ phone, logger }) }),
    login: async (_, { phone, code }, { logger }) => ({ token: login({ phone, code, logger }) }),
    updateUser: async (_, __, { wallet }) => ({
      setUsername: async ({ username }) => await wallet.setUsername({ username }),
      setLanguage: async ({ language }) => await wallet.setLanguage({ language }),
      updateUsername: (input) => wallet.updateUsername(input),
      updateLanguage: (input) => wallet.updateLanguage(input),
    }),
    setLevel: async (_, { uid, level }) => {
      return AdminOps.setLevel({ uid, level })
    },
    updateContact: async (_, __, { user }) => ({
      setName: async ({ username, name }) => {
        user.contacts.filter(item => item.id === username)[0].name = name
        await user.save()
        return true
      }
    }),
    noauthAddInvoice: async (_, { uid }, { logger }) => {
      const user = await User.findOne({_id: uid})
      const wallet = await WalletFactory({ user, logger })
      return wallet.addInvoice({ selfGenerated: false })
    },
    invoice: async (_, __, { wallet }) => ({
      addInvoice: async ({ value, memo }) => wallet.addInvoice({ value, memo }),
      // FIXME: move to query
      updatePendingInvoice: async ({ hash }) => wallet.updatePendingInvoice({ hash }),
      payInvoice: async ({ invoice, amount, memo }) => wallet.pay({ invoice, amount, memo }),
      payKeysendUsername: async ({ destination, username, amount, memo }) => wallet.pay({ destination, username, amount, memo }),
      getFee: async ({ destination, amount, invoice, memo }) => wallet.getLightningFee({ destination, amount, invoice, memo })
    }),
    earnCompleted: async (_, { ids }, { wallet }) => wallet.addEarn(ids),
    deleteUser: () => {
      // TODO
    },
    onchain: async (_, __, { wallet }) => ({
      getNewAddress: () => wallet.getOnChainAddress(),
      pay: ({ address, amount, memo }) => ({ success: wallet.onChainPay({ address, amount, memo }) }),
      getFee: ({ address, amount }) => wallet.getOnchainFee({ address, amount }),
    }),
    addDeviceToken: async (_, { deviceToken }, { user }) => {
      user.deviceToken.addToSet(deviceToken)
      // TODO: check if this is ok to shared a mongoose user instance and mutate it.
      await user.save()
      return { success: true }
    },

    // FIXME test
    testMessage: async (_, __, { user, logger }) => {
      // throw new LoggedError("test error")
      await sendNotification({
        user,
        title: "Title",
        body: `New message sent at ${moment.utc().format('YYYY-MM-DD HH:mm:ss')}`,
        logger
      })
      return { success: true }
    },
    addToMap: async (_, { username, title, latitude, longitude }, { }) => {
      return AdminOps.addToMap({ username, title, latitude, longitude });
    },
    setAccountStatus: async (_, { uid, status }, { }) => {
      return AdminOps.setAccountStatus({ uid, status })
    }
  }
}

const isAuthenticated = rule({ cache: 'contextual' })(
  async (parent, args, ctx, info) => {
    if(ctx.uid === null) {
      return new Error(`${util.inspect({ message: 'Not authorised!', request: ctx.request.body }, false, Infinity)}`)
    }
    return true
  },
)

const isEditor = rule({ cache: "contextual" })(
  async (parent, args, ctx, info) => {
    return ctx.user.role === "editor";
  }
);

const permissions = shield({
  Query: {
    // prices: not(isAuthenticated),
    // earnList: isAuthenticated,
    me: isAuthenticated,
    wallet: isAuthenticated,
    wallet2: isAuthenticated,
    getLastOnChainAddress: isAuthenticated,
    getUserDetails: and(isAuthenticated, isEditor),
    getUid: and(isAuthenticated, isEditor),
    getLevels: and(isAuthenticated, isEditor)
  },
  Mutation: {
    // requestPhoneCode: not(isAuthenticated),
    // login: not(isAuthenticated),

    onchain: isAuthenticated,
    invoice: isAuthenticated,
    earnCompleted: isAuthenticated,
    updateUser: isAuthenticated,
    updateContact: isAuthenticated,
    deleteUser: isAuthenticated,
    addDeviceToken: isAuthenticated,
    testMessage: isAuthenticated,
    addToMap: and(isAuthenticated, isEditor),
    setLevel: and(isAuthenticated, isEditor),
    setAccountStatus: and(isAuthenticated, isEditor)
  },
}, { allowExternalErrors: true }) // TODO remove to not expose internal error


export async function startApolloServer() {
  const app = express();

  const schema = applyMiddleware(
    makeExecutableSchema({
      typeDefs: importSchema(path.join(__dirname, "../schema.graphql")),
      resolvers,
    }),
    permissions
  );

  const server = new ApolloServer({
    schema,
    playground: process.env.NETWORK !== 'mainnet',
    introspection: process.env.NETWORK !== 'mainnet',
    context: async (context) => {
      // @ts-ignore
      const token = context.req?.token ?? null
      const uid = token?.uid ?? null

      let wallet, user

      // TODO move from id: uuidv4() to a Jaeger standard 
      const logger = graphqlLogger.child({ token, id: uuidv4(), body: context.req?.body })

      if (!!uid) {
        user = await User.findOneAndUpdate({ _id: uid },{ lastConnection: new Date() }, {new: true})
        fetchIPDetails({currentIP: context.req?.headers['x-real-ip'], user, logger})
        wallet = (!!user && user.status === "active") ? await WalletFactory({ user, logger }) : null
      }

      // @ts-ignore
      return {
        ...context,
        logger,
        uid,
        wallet,
        user
      }
    },
    formatError: err => {
      let log
      
      if((log = err.extensions?.exception?.log)) {
        log({error:{message: err.message, code: err.extensions.code}})
        if(err.extensions.exception.forwardToClient) {
          return err
        }
      } else {
        graphqlLogger.error(err)
      }

      return new Error('Internal server error');
    },
  })

  app.use(pino_http)

  app.use(
    expressJwt({
      secret: process.env.JWT_SECRET,
      algorithms: ["HS256"],
      credentialsRequired: false,
      requestProperty: 'token'
    }))

  app.use(swStats.getMiddleware({
    uriPath: "/swagger",
    // no authentication but /swagger/* should be protected from access outside the cluster
    // this is done with nginx 
  }))

  // Health check
  app.get('/healthz', async function(req, res) {
    const isMongoAlive = mongoose.connection.readyState == 1 ? true : false
    const isRedisAlive = await getAsyncRedisClient().ping() === 'PONG'
    res.status((isMongoAlive && isRedisAlive) ? 200 : 503).send();
  });


  // Mount Apollo middleware here.
  // server.applyMiddleware({ app: permissions });
  // middlewares: [permissions],

  server.applyMiddleware({ app });

  // @ts-ignore
  await new Promise(resolve => app.listen({ port: 4000 }, resolve));

  console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`);
  return { server, app };
}


setupMongoConnection().then(async () => {
  await startApolloServer()
}).catch((err) => graphqlLogger.error(err, "server error"))

