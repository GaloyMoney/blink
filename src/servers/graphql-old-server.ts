import {
  stringLength,
  ValidateDirectiveVisitor,
  range,
  pattern,
} from "@profusion/apollo-validation-directives"
import dotenv from "dotenv"
import fs from "fs"
import { applyMiddleware } from "graphql-middleware"
import { and, shield } from "graphql-shield"
import { makeExecutableSchema } from "graphql-tools"
import moment from "moment"
import path from "path"

import { levels, onboardingEarn, getTransactionLimits, getFeeRates } from "@config/app"

import { setupMongoConnection } from "@services/mongodb"
import { activateLndHealthCheck } from "@services/lnd/health"
import { baseLogger } from "@services/logger"
import { getActiveLnd, nodesStats, nodeStats } from "@services/lnd/utils"
import { getHourlyPrice, getMinBuildNumber } from "@services/local-cache"
import { getCurrentPrice } from "@services/realtime-price"
import { User } from "@services/mongoose/schema"

import { addToMap, setAccountStatus, setLevel } from "@core/admin-ops"
import { sendNotification } from "@core/notifications/notification"
import { login, requestPhoneCode } from "@core/text"
import { getWalletFromUsername } from "@core/wallet-factory"

import { usernameExists } from "../domain/user"
import { startApolloServer, isAuthenticated, isEditor } from "./graphql-server"

const graphqlLogger = baseLogger.child({ module: "graphql" })

dotenv.config()

const commitHash = process.env.COMMITHASH
const buildTime = process.env.BUILDTIME
const helmRevision = process.env.HELMREVISION

const resolvers = {
  Query: {
    me: (_, __, { uid, user }) => {
      const { phone, username, contacts, language, level } = user

      return {
        id: uid,
        level,
        phone,
        username,
        contacts,
        language,
      }
    },

    // legacy, before handling multi currency account
    wallet: (_, __, { wallet }) => [
      {
        id: "BTC",
        currency: "BTC",
        balance: async () => (await wallet.getBalances())["BTC"],
        transactions: () => wallet.getTransactions(),
        csv: () => wallet.getStringCsv(),
      },
    ],

    // new way to return the balance
    // balances are distinc between USD and BTC
    // but transaction are common, because they could have rely both on USD/BTC
    wallet2: async (_, __, { wallet }) => {
      const balances = await wallet.getBalances()

      return {
        transactions: wallet.getTransactions(),
        balances: wallet.user.currencies.map((item) => ({
          id: item.id,
          balance: balances[item.id],
        })),
      }
    },
    // deprecated
    nodeStats: async () => {
      const { lnd } = getActiveLnd()
      return await nodeStats({ lnd })
    },
    nodesStats: async () => await nodesStats(),
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
        o: getCurrentPrice(),
      })

      return hourly.splice(-length)
    },
    earnList: (_, __, { user }) => {
      const response: Record<string, Primitive>[] = []
      const earned = user?.earn || []

      for (const [id, value] of Object.entries(onboardingEarn)) {
        response.push({
          id,
          value,
          completed: earned.findIndex((item) => item === id) !== -1,
        })
      }

      return response
    },
    getLastOnChainAddress: async (_, __, { wallet }) => ({
      id: await wallet.getLastOnChainAddress(),
    }),
    maps: async () => {
      // TODO: caching
      const users = await User.find(
        {
          title: { $exists: true },
          coordinate: { $exists: true },
        },
        { username: 1, title: 1, coordinate: 1 },
      )

      return users.map((user) => ({
        ...user._doc,
        id: user.username,
      }))
    },
    usernameExists: async (_, { username }) => await usernameExists({ username }),
    getUserDetails: async (_, { uid }) => await User.findOne({ _id: uid }),
    noauthUpdatePendingInvoice: async (_, { hash, username }, { logger }) => {
      const wallet = await getWalletFromUsername({ username, logger })
      return wallet.updatePendingInvoice({ hash })
    },
    getUid: async (_, { username, phone }) => {
      const { _id: uid } = username
        ? await User.getUserByUsername(username)
        : await User.getUserByPhone(phone)
      return uid
    },
    getLevels: () => levels,
    getLimits: (_, __, { user }) => {
      const transactionLimits = getTransactionLimits({ level: user.level })
      return {
        oldEnoughForWithdrawal: transactionLimits.oldEnoughForWithdrawalMicroseconds,
        withdrawal: transactionLimits.withdrawalLimit,
        onUs: transactionLimits.onUsLimit,
      }
    },
    getWalletFees: () => {
      const feeRates = getFeeRates()
      return { deposit: feeRates.depositFeeVariable }
    },
  },
  Mutation: {
    requestPhoneCode: async (_, { phone }, { logger, ip }) => ({
      success: await requestPhoneCode({ phone, logger, ip }),
    }),
    login: async (_, { phone, code }, { logger, ip }) => ({
      token: await login({ phone, code, logger, ip }),
    }),
    updateUser: (_, __, { wallet }) => ({
      setUsername: async ({ username }) => await wallet.setUsername({ username }),
      setLanguage: async ({ language }) => await wallet.setLanguage({ language }),
      updateUsername: (input) => wallet.updateUsername(input),
      updateLanguage: (input) => wallet.updateLanguage(input),
    }),
    setLevel: async (_, { uid, level }) => {
      return await setLevel({ uid, level })
    },
    updateContact: (_, __, { user }) => ({
      setName: async ({ username, name }) => {
        user.contacts.filter((item) => item.id === username)[0].name = name
        await user.save()
        return true
      },
    }),
    noauthAddInvoice: async (_, { username, value }, { logger }) => {
      const wallet = await getWalletFromUsername({ username, logger })
      return wallet.addInvoice({ selfGenerated: false, value })
    },
    invoice: (_, __, { wallet }) => ({
      addInvoice: async ({ value, memo }) => await wallet.addInvoice({ value, memo }),
      // FIXME: move to query
      updatePendingInvoice: async ({ hash }) =>
        await wallet.updatePendingInvoice({ hash }),
      payInvoice: async ({ invoice, amount, memo }) =>
        await wallet.pay({ invoice, amount, memo }),
      payKeysendUsername: async ({ username, amount, memo }) =>
        await wallet.pay({ username, amount, memo }),
      getFee: async ({ amount, invoice }) =>
        await wallet.getLightningFee({ amount, invoice }),
    }),
    earnCompleted: async (_, { ids }, { wallet }) => await wallet.addEarn(ids),
    onchain: (_, __, { wallet }) => ({
      getNewAddress: () => wallet.getOnChainAddress(),
      pay: ({ address, amount, memo }) => ({
        success: wallet.onChainPay({ address, amount, memo }),
      }),
      payAll: ({ address, memo }) => ({
        success: wallet.onChainPay({ address, amount: 0, memo, sendAll: true }),
      }),
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
        body: `New message sent at ${moment.utc().format("YYYY-MM-DD HH:mm:ss")}`,
        logger,
      })
      return { success: true }
    },
    addToMap: async (_, { username, title, latitude, longitude }, { logger }) => {
      return await addToMap({ username, title, latitude, longitude, logger })
    },
    setAccountStatus: async (_, { uid, status }) => {
      return await setAccountStatus({ uid, status })
    },
  },
}

export async function startApolloServerForOldSchema() {
  const myTypeDefs = fs.readFileSync(
    path.join(__dirname, "../graphql/old-schema.graphql"),
    {
      encoding: "utf8",
      flag: "r",
    },
  )

  const execSchema = makeExecutableSchema({
    typeDefs: [
      myTypeDefs,
      ...ValidateDirectiveVisitor.getMissingCommonTypeDefs(),
      ...range.getTypeDefs(),
      ...pattern.getTypeDefs(),
      ...stringLength.getTypeDefs(),
    ],
    // @ts-expect-error: TODO
    schemaDirectives: { pattern, range, stringLength },
    resolvers,
  })

  ValidateDirectiveVisitor.addValidationResolversToSchema(execSchema)

  const permissions = shield(
    {
      Query: {
        me: isAuthenticated,
        wallet: isAuthenticated,
        wallet2: isAuthenticated,
        getLastOnChainAddress: isAuthenticated,
        getUserDetails: and(isAuthenticated, isEditor),
        getUid: and(isAuthenticated, isEditor),
        getLevels: and(isAuthenticated, isEditor),
      },
      Mutation: {
        onchain: isAuthenticated,
        invoice: isAuthenticated,
        earnCompleted: isAuthenticated,
        updateUser: isAuthenticated,
        updateContact: isAuthenticated,
        addDeviceToken: isAuthenticated,
        testMessage: isAuthenticated,
        addToMap: and(isAuthenticated, isEditor),
        setLevel: and(isAuthenticated, isEditor),
        setAccountStatus: and(isAuthenticated, isEditor),
      },
    },
    { allowExternalErrors: true },
  ) // TODO remove to not expose internal error

  const schema = applyMiddleware(execSchema, permissions)

  return await startApolloServer({ schema, port: 4000 })
}

if (require.main === module) {
  setupMongoConnection()
    .then(async () => {
      await startApolloServerForOldSchema()
      activateLndHealthCheck()
    })
    .catch((err) => graphqlLogger.error(err, "server error"))
}
