import {
  stringLength,
  ValidateDirectiveVisitor,
  range,
  pattern,
} from "@profusion/apollo-validation-directives"
import dotenv from "dotenv"
import fs from "fs"
import { applyMiddleware } from "graphql-middleware"
import { shield } from "graphql-shield"
import { makeExecutableSchema } from "graphql-tools"
import moment from "moment"
import path from "path"

import { getFeeRates, onboardingEarn } from "@config/app"

import * as Wallets from "@app/wallets"
import { SettlementMethod, PaymentInitiationMethod, TxStatus } from "@domain/wallets"
import { setupMongoConnection } from "@services/mongodb"
import { activateLndHealthCheck } from "@services/lnd/health"
import { baseLogger } from "@services/logger"
import { getActiveLnd, nodesStats, nodeStats } from "@services/lnd/utils"
import { getHourlyPrice, getMinBuildNumber } from "@services/local-cache"
import { getCurrentPrice } from "@services/realtime-price"
import { User } from "@services/mongoose/schema"
import { sendNotification } from "@services/notifications/notification"
import { login, requestPhoneCode } from "@core/text"
import { usernameExists } from "@core/user"

import { startApolloServer, isAuthenticated } from "./graphql-server"
import { ApolloError } from "apollo-server-errors"

const graphqlLogger = baseLogger.child({ module: "graphql" })

dotenv.config()

const commitHash = process.env.COMMITHASH
const buildTime = process.env.BUILDTIME
const helmRevision = process.env.HELMREVISION

const translateWalletTx = (txs: WalletTransaction[]) => {
  return txs.map((tx: WalletTransaction) => ({
    id: tx.id,
    amount: tx.settlementAmount,
    description: tx.deprecated.description,
    fee: tx.settlementFee,
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date#get_the_number_of_seconds_since_the_ecmascript_epoch
    created_at: Math.floor(tx.createdAt.getTime() / 1000),
    usd: tx.deprecated.usd,
    sat: tx.settlementAmount,
    pending: tx.status == TxStatus.Pending,
    type: tx.deprecated.type,
    feeUsd: tx.deprecated.feeUsd,
    hash: tx.initiationVia === PaymentInitiationMethod.Lightning ? tx.paymentHash : null,
    addresses: tx.initiationVia === PaymentInitiationMethod.OnChain ? tx.addresses : null,
    username: tx.settlementVia === SettlementMethod.IntraLedger ? tx.recipientId : null,
  }))
}

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
        twoFAEnabled: user.twoFAEnabled,
      }
    },

    // legacy, before handling multi currency account
    wallet: (_, __, { wallet, logger }) => [
      {
        id: "BTC",
        currency: "BTC",
        balance: async () => {
          const balanceSats = await Wallets.getBalanceForWallet({
            walletId: wallet.user.id as WalletId,
            logger,
          })
          if (balanceSats instanceof Error) throw balanceSats

          return balanceSats
        },
        transactions: async () => {
          const { result: txs, error } = await Wallets.getTransactionsForWalletId({
            walletId: wallet.user.id,
          })
          if (error instanceof Error || txs === null) {
            throw error
          }

          return translateWalletTx(txs)
        },
        csv: () => wallet.getStringCsv(),
      },
    ],

    // new way to return the balance
    // balances are distinc between USD and BTC
    // but transaction are common, because they could have rely both on USD/BTC
    wallet2: async (_, __, { wallet }) => {
      const balances = await wallet.getBalances()

      return {
        transactions: async () => {
          const { result: txs, error } = await Wallets.getTransactionsForWalletId({
            walletId: wallet.user.id,
          })
          if (error instanceof Error || txs === null) {
            throw error
          }

          return translateWalletTx(txs)
        },
        balances: wallet.user.currencies.map((item) => ({
          id: item.id,
          balance: balances[item.id],
        })),
      }
    },
    // deprecated
    nodeStats: async () => {
      const { lnd } = getActiveLnd()
      return nodeStats({ lnd })
    },
    nodesStats: async () => nodesStats(),
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
    getLastOnChainAddress: async (_, __, { wallet }) => {
      const address = await Wallets.getLastOnChainAddress(wallet.user.id)
      if (address instanceof Error) throw address

      return {
        id: address,
      }
    },
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
    usernameExists: async (_, { username }) => usernameExists({ username }),
    noauthUpdatePendingInvoice: async (_, { hash }, { logger }) => {
      const result = Wallets.updatePendingInvoiceByPaymentHash({
        paymentHash: hash,
        logger,
      })
      if (result instanceof Error) throw result
      return result
    },
    getLimits: (_, __, { wallet }) => wallet.getUserLimits(),
    getWalletFees: () => {
      const feeRates = getFeeRates()
      return { deposit: feeRates.depositFeeVariable }
    },
  },
  Mutation: {
    requestPhoneCode: async (_, { phone }, { logger, ip }) => {
      if (!phone) {
        throw new ApolloError("Missing phone value", "GRAPHQL_VALIDATION_FAILED")
      }
      return {
        success: await requestPhoneCode({ phone, logger, ip }),
      }
    },
    login: async (_, { phone, code }, { logger, ip }) => {
      if (!phone || !code) {
        throw new ApolloError("Missing phone/code value", "GRAPHQL_VALIDATION_FAILED")
      }
      return { token: await login({ phone, code, logger, ip }) }
    },
    generate2fa: async (_, __, { wallet }) => wallet.generate2fa(),
    save2fa: async (_, { secret, token }, { wallet }) =>
      wallet.save2fa({ secret, token }),
    delete2fa: async (_, { token }, { wallet }) => wallet.delete2fa({ token }),
    updateUser: (_, __, { wallet }) => ({
      setUsername: async ({ username }) => wallet.setUsername({ username }),
      setLanguage: async ({ language }) => wallet.setLanguage({ language }),
      updateUsername: (input) => wallet.updateUsername(input),
      updateLanguage: (input) => wallet.updateLanguage(input),
    }),
    updateContact: (_, __, { user }) => ({
      setName: async ({ username, name }) => {
        user.contacts.filter((item) => item.id === username)[0].name = name
        await user.save()
        return true
      },
    }),
    noauthAddInvoice: async (_, { username, value }) => {
      const lnInvoice =
        value && value > 0
          ? await Wallets.addInvoiceForRecipient({
              recipient: username,
              amount: value,
            })
          : await Wallets.addInvoiceNoAmountForRecipient({
              recipient: username,
            })
      if (lnInvoice instanceof Error) throw lnInvoice
      return lnInvoice.paymentRequest
    },
    invoice: (_, __, { wallet, logger }) => ({
      addInvoice: async ({ value, memo }) => {
        const lnInvoice =
          value && value > 0
            ? await Wallets.addInvoice({
                walletId: wallet.user.id,
                amount: value,
                memo,
              })
            : await Wallets.addInvoiceNoAmount({
                walletId: wallet.user.id,
                memo,
              })
        if (lnInvoice instanceof Error) throw lnInvoice
        return lnInvoice.paymentRequest
      },
      // FIXME: move to query
      updatePendingInvoice: async ({ hash }) => {
        const result = Wallets.updatePendingInvoiceByPaymentHash({
          paymentHash: hash,
          logger,
        })
        if (result instanceof Error) throw result
        return result
      },
      payInvoice: async ({ invoice, amount, memo }) =>
        wallet.pay({ invoice, amount, memo }),
      payKeysendUsername: async ({ username, amount, memo }) =>
        wallet.pay({ username, amount, memo }),
      getFee: async ({ amount, invoice }) => wallet.getLightningFee({ amount, invoice }),
    }),
    earnCompleted: async (_, { ids }, { wallet }) => wallet.addEarn(ids),
    onchain: (_, __, { wallet }) => ({
      getNewAddress: async () => {
        const address = await Wallets.createOnChainAddress(wallet.user.id)
        if (address instanceof Error) throw address
        return address
      },
      pay: ({ address, amount, memo }) => ({
        success: wallet.onChainPay({ address, amount, memo }),
      }),
      payAll: ({ address, memo }) => ({
        success: wallet.onChainPay({ address, amount: 0, memo, sendAll: true }),
      }),
      getFee: async ({ address, amount }) => {
        const fee = await Wallets.getOnChainFeeByWalletId(wallet.user.id, amount, address)
        if (fee instanceof Error) throw fee
        return fee
      },
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
      },
      Mutation: {
        generate2fa: isAuthenticated,
        delete2fa: isAuthenticated,
        save2fa: isAuthenticated,
        onchain: isAuthenticated,
        invoice: isAuthenticated,
        earnCompleted: isAuthenticated,
        updateUser: isAuthenticated,
        updateContact: isAuthenticated,
        addDeviceToken: isAuthenticated,
        testMessage: isAuthenticated,
      },
    },
    { allowExternalErrors: true },
  ) // TODO remove to not expose internal error

  const schema = applyMiddleware(execSchema, permissions)

  return startApolloServer({ schema, port: 4000 })
}

if (require.main === module) {
  setupMongoConnection()
    .then(async () => {
      await startApolloServerForOldSchema()
      activateLndHealthCheck()
    })
    .catch((err) => graphqlLogger.error(err, "server error"))
}
