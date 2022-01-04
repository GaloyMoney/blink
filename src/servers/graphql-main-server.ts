import dotenv from "dotenv"
import { applyMiddleware } from "graphql-middleware"
import { or, shield } from "graphql-shield"

import { setupMongoConnection } from "@services/mongodb"
import { activateLndHealthCheck } from "@services/lnd/health"
import { baseLogger } from "@services/logger"

import { gqlMainSchema } from "../graphql"

import {
  isApiKeyAuthenticated,
  isAuthenticated,
  startApolloServer,
} from "./graphql-server"
import { walletIdMiddleware } from "./middlewares/wallet-id"

const graphqlLogger = baseLogger.child({ module: "graphql" })

dotenv.config()

export async function startApolloServerForCoreSchema() {
  const permissions = shield(
    {
      Query: {
        me: isAuthenticated,
        onChainTxFee: isAuthenticated,
        accountApiKeys: isAuthenticated,
      },
      Mutation: {
        userQuizQuestionUpdateCompleted: isAuthenticated,
        userUpdateLanguage: isAuthenticated,
        userContactUpdateAlias: isAuthenticated,

        twoFAGenerate: isAuthenticated,
        twoFASave: isAuthenticated,
        twoFADelete: isAuthenticated,

        deviceNotificationTokenCreate: isAuthenticated,

        accountApiKeyCreate: isAuthenticated,
        accountApiKeyDisable: isAuthenticated,

        lnInvoiceFeeProbe: or(isAuthenticated, isApiKeyAuthenticated),
        lnNoAmountInvoiceFeeProbe: or(isAuthenticated, isApiKeyAuthenticated),

        lnInvoiceCreate: or(isAuthenticated, isApiKeyAuthenticated),
        lnNoAmountInvoiceCreate: or(isAuthenticated, isApiKeyAuthenticated),

        lnInvoicePaymentSend: or(isAuthenticated, isApiKeyAuthenticated),
        lnNoAmountInvoicePaymentSend: or(isAuthenticated, isApiKeyAuthenticated),

        intraLedgerPaymentSend: or(isAuthenticated, isApiKeyAuthenticated),

        onChainAddressCreate: or(isAuthenticated, isApiKeyAuthenticated),
        onChainAddressCurrent: or(isAuthenticated, isApiKeyAuthenticated),
        onChainPaymentSend: or(isAuthenticated, isApiKeyAuthenticated),
        onChainPaymentSendAll: or(isAuthenticated, isApiKeyAuthenticated),
      },
    },
    { allowExternalErrors: true },
  )

  const schema = applyMiddleware(gqlMainSchema, permissions, walletIdMiddleware)
  return startApolloServer({ schema, port: 4002, startSubscriptionServer: true })
}

if (require.main === module) {
  setupMongoConnection(true)
    .then(async () => {
      await startApolloServerForCoreSchema()
      activateLndHealthCheck()
    })
    .catch((err) => graphqlLogger.error(err, "server error"))
}
