import fs from "fs"

import path from "path"

import { Accounts, Prices, Users, Wallets } from "@app"
import { getBuildVersions, getFeeRates, onboardingEarn } from "@config/app"
import { usernameExists } from "@core/user"
import { addInvoiceForUsername, addInvoiceNoAmountForUsername } from "@core/wallets"
import { decodeInvoice } from "@domain/bitcoin/lightning"
import { LnPaymentRequestZeroAmountRequiredError } from "@domain/errors"
import { PriceInterval, PriceRange } from "@domain/price"
import { PaymentInitiationMethod, SettlementMethod, TxStatus } from "@domain/wallets"
import { mapError } from "@graphql/error-map"
import {
  pattern,
  range,
  stringLength,
  ValidateDirectiveVisitor,
} from "@profusion/apollo-validation-directives"
import { activateLndHealthCheck } from "@services/lnd/health"
import { getActiveLnd, nodesStats, nodeStats } from "@services/lnd/utils"
import { baseLogger } from "@services/logger"
import { setupMongoConnection } from "@services/mongodb"
import { User } from "@services/mongoose/schema"
import {
  addAttributesToCurrentSpanAndPropagate,
  ENDUSER_ALIAS,
  SemanticAttributes,
} from "@services/tracing"
import { ApolloError } from "apollo-server-errors"
import dotenv from "dotenv"
import { applyMiddleware } from "graphql-middleware"
import { shield } from "graphql-shield"
import { makeExecutableSchema } from "graphql-tools"

import { isAuthenticated, startApolloServer } from "./graphql-server"

const graphqlLogger = baseLogger.child({ module: "graphql" })

dotenv.config()

const commitHash = process.env.COMMITHASH
const buildTime = process.env.BUILDTIME
const helmRevision = process.env.HELMREVISION

const getHash = (tx: WalletTransaction) => {
  switch (tx.settlementVia.type) {
    case SettlementMethod.Lightning:
      return (tx.initiationVia as InitiationViaLn).paymentHash
    case SettlementMethod.OnChain:
      return tx.settlementVia.transactionHash
    case SettlementMethod.IntraLedger:
      return null
  }
}

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
    hash: getHash(tx),
    addresses:
      tx.initiationVia.type === PaymentInitiationMethod.OnChain &&
      tx.initiationVia.address
        ? [tx.initiationVia.address]
        : null,
    username:
      tx.settlementVia.type === SettlementMethod.IntraLedger
        ? tx.settlementVia.counterPartyUsername
        : null,
  }))
}

const resolvers = {
  Query: {
    me: (_, __, { uid, user, ip, domainUser, domainAccount }) =>
      addAttributesToCurrentSpanAndPropagate(
        {
          [SemanticAttributes.ENDUSER_ID]: domainUser?.id,
          [ENDUSER_ALIAS]: domainUser?.username,
          [SemanticAttributes.HTTP_CLIENT_IP]: ip,
        },
        async () => {
          const { phone, username, language, level } = user
          const { contacts } = domainAccount

          return {
            id: uid,
            level,
            phone,
            username,
            contacts,
            language,
            twoFAEnabled: !!user.twoFA.secret,
          }
        },
      ),

    // legacy, before handling multi currency account
    wallet: (_, __, { wallet, logger }) => [
      {
        id: "BTC",
        currency: "BTC",
        balance: async () => {
          const balanceSats = await Wallets.getBalanceForWallet({
            walletId: wallet.user.defaultWalletId as WalletId,
            logger,
          })
          if (balanceSats instanceof Error) throw balanceSats

          return balanceSats
        },
        transactions: async () => {
          const { result: txs, error } = await Wallets.getTransactionsForWalletId({
            walletId: wallet.user.defaultWalletId,
          })
          if (error instanceof Error || txs === null) {
            throw error
          }

          return translateWalletTx(txs)
        },
        csv: () => wallet.getStringCsv(),
      },
    ],

    // deprecated
    nodeStats: async () => {
      const { lnd } = getActiveLnd()
      return nodeStats({ lnd })
    },
    nodesStats: async () => nodesStats(),
    buildParameters: async () => {
      const {
        minBuildNumberAndroid,
        lastBuildNumberAndroid,
        minBuildNumberIos,
        lastBuildNumberIos,
      } = getBuildVersions()
      return {
        commitHash: () => commitHash,
        buildTime: () => buildTime,
        helmRevision: () => helmRevision,
        minBuildNumberAndroid,
        minBuildNumberIos,
        lastBuildNumberAndroid,
        lastBuildNumberIos,
      }
    },
    prices: async (_, { length = 365 * 24 * 10 }) => {
      let hourly: Tick[] | PriceServiceError = []
      if (length > 1) {
        hourly = await Prices.getPriceHistory({
          range: PriceRange.OneYear,
          interval: PriceInterval.OneHour,
        })
        if (hourly instanceof Error) throw hourly
      }

      const currentPrice = await Prices.getCurrentPrice()
      if (currentPrice instanceof Error) throw currentPrice

      // adding the current price as the lat index array
      // use by the mobile application to convert prices
      hourly.push({
        date: new Date(Date.now()),
        price: currentPrice,
      })

      return hourly
        .splice(-length)
        .map((p) => ({ id: Math.floor(p.date.getTime() / 1000), o: p.price }))
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
      const address = await Wallets.getLastOnChainAddress(
        (wallet.user as UserRecord).defaultWalletId,
      )
      if (address instanceof Error) throw address

      return {
        id: address,
      }
    },
    maps: async () => {
      // TODO: caching
      const users = await User.find(
        {
          title: { $exists: true, $ne: null },
          coordinates: { $exists: true, $ne: null },
        },
        { username: 1, title: 1, coordinates: 1 },
      )

      return users.map((user) => ({
        ...user._doc,
        coordinate: user.coordinates,
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
      let success = true
      const result = await Users.requestPhoneCode({ phone, logger, ip })
      if (result instanceof Error) success = false
      return { success }
    },
    login: async (_, { phone, code }, { logger, ip }) => {
      if (!phone || !code) {
        throw new ApolloError("Missing phone/code value", "GRAPHQL_VALIDATION_FAILED")
      }
      const authToken = await Users.login({ phone, code, logger, ip })

      if (authToken instanceof Error) {
        return { token: null }
      }

      return { token: authToken }
    },
    generate2fa: async (_, __, { wallet }) => wallet.generate2fa(),
    save2fa: async (_, { secret, token }, { wallet }) =>
      wallet.save2fa({ secret, token }),
    delete2fa: async (_, { token }, { wallet }) => wallet.delete2fa({ token }),
    updateUser: (_, __, { wallet, domainUser }) => ({
      setUsername: async ({ username }) => wallet.setUsername({ username }),
      setLanguage: async ({ language }) => {
        const result = await Users.updateLanguage({ userId: domainUser.id, language })
        if (result instanceof Error) throw mapError(result)
        return true
      },
      updateUsername: (input) => wallet.setUsername(input),
      updateLanguage: async ({ language }) => {
        const result = await Users.updateLanguage({ userId: domainUser.id, language })
        if (result instanceof Error) throw mapError(result)
        return { id: result.id, language: result.language }
      },
    }),
    updateContact: (_, __, { domainAccount }) => ({
      setName: async ({ username, name }) => {
        const contact = await Accounts.updateContactAlias({
          accountId: domainAccount.id,
          username,
          alias: name,
        })
        if (contact instanceof Error) throw mapError(contact)
        return true
      },
    }),
    noauthAddInvoice: async (_, { username, value }) => {
      const lnInvoice =
        value && value > 0
          ? await addInvoiceForUsername({
              username,
              amount: value,
            })
          : await addInvoiceNoAmountForUsername({
              username,
            })
      if (lnInvoice instanceof Error) throw mapError(lnInvoice)
      return lnInvoice.paymentRequest
    },
    invoice: (_, __, { wallet, logger }) => ({
      addInvoice: async ({ value, memo }) => {
        const lnInvoice =
          value && value > 0
            ? await Wallets.addInvoiceByWalletId({
                walletId: wallet.user.defaultWalletId,
                amount: value,
                memo,
              })
            : await Wallets.addInvoiceNoAmountByWalletId({
                walletId: wallet.user.defaultWalletId,
                memo,
              })
        if (lnInvoice instanceof Error) throw mapError(lnInvoice)
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
      payInvoice: async ({ invoice, amount, memo }, _, { ip, domainUser }) =>
        addAttributesToCurrentSpanAndPropagate(
          {
            [SemanticAttributes.ENDUSER_ID]: domainUser?.id,
            [ENDUSER_ALIAS]: domainUser?.username,
            [SemanticAttributes.HTTP_CLIENT_IP]: ip,
          },
          async () => {
            const decodedInvoice = decodeInvoice(invoice)
            if (decodedInvoice instanceof Error) throw decodedInvoice

            const { amount: lnInvoiceAmount } = decodedInvoice
            if (lnInvoiceAmount && lnInvoiceAmount > 0) {
              const status = await Wallets.lnInvoicePaymentSend({
                paymentRequest: invoice,
                memo,
                senderWalletId: wallet.user.defaultWalletId as WalletId,
                payerAccountId: wallet.user.id as AccountId,
                logger,
              })
              if (status instanceof Error) throw mapError(status)
              return status.value
            }
            const status = await Wallets.lnNoAmountInvoicePaymentSend({
              paymentRequest: invoice,
              memo,
              amount,
              senderWalletId: wallet.user.defaultWalletId as WalletId,
              payerAccountId: wallet.user.id as AccountId,
              logger,
            })
            if (status instanceof Error) throw mapError(status)
            return status.value
          },
        ),
      payKeysendUsername: async ({ username, amount, memo }) => {
        const status = await Wallets.intraledgerPaymentSendUsername({
          recipientUsername: username,
          memo,
          amount,
          senderWalletId: wallet.user.defaultWalletId,
          payerAccountId: wallet.user.id,
          logger,
        })

        if (status instanceof Error) throw mapError(status)

        return status.value
      },
      getFee: async ({ amount, invoice }) => {
        let feeSatAmount: Satoshis | ApplicationError
        if (amount && amount > 0) {
          feeSatAmount = await Wallets.getNoAmountLightningFee({
            walletId: wallet.user.defaultWalletId,
            amount,
            paymentRequest: invoice,
          })
          if (!(feeSatAmount instanceof Error)) return feeSatAmount
          if (!(feeSatAmount instanceof LnPaymentRequestZeroAmountRequiredError))
            throw mapError(feeSatAmount)
        }

        feeSatAmount = await Wallets.getLightningFee({
          walletId: wallet.user.defaultWalletId,
          paymentRequest: invoice,
        })
        if (feeSatAmount instanceof Error) throw mapError(feeSatAmount)
        return feeSatAmount
      },
    }),
    earnCompleted: async (_, { ids }, { uid, logger }) => {
      const quizQuestion = await Accounts.addEarn({
        quizQuestionId: ids[0],
        accountId: uid,
        logger,
      })
      if (quizQuestion instanceof Error) throw mapError(quizQuestion)

      return [
        {
          id: quizQuestion.id,
          value: quizQuestion.earnAmount,
          completed: true,
        },
      ]
    },
    onchain: (_, __, { wallet }) => ({
      getNewAddress: async () => {
        const address = await Wallets.createOnChainAddress(wallet.user.defaultWalletId)
        if (address instanceof Error) throw mapError(address)
        return address
      },
      pay: async ({ address, amount, memo }) => {
        const status = await Wallets.payOnChainByWalletId({
          senderWalletId: wallet.user.defaultWalletId,
          amount,
          address,
          targetConfirmations: 1,
          memo,
          sendAll: false,
        })
        if (status instanceof Error) throw mapError(status)

        return { success: true }
      },
      payAll: async ({ address, memo }) => {
        const status = await Wallets.payOnChainByWalletId({
          senderWalletId: wallet.user.defaultWalletId,
          amount: 0,
          address,
          targetConfirmations: 1,
          memo,
          sendAll: true,
        })
        if (status instanceof Error) throw mapError(status)

        return { success: true }
      },
      getFee: async ({ address, amount }) => {
        const fee = await Wallets.getOnChainFeeByWalletId({
          walletId: wallet.user.defaultWalletId,
          amount,
          address,
          targetConfirmations: 1,
        })
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
