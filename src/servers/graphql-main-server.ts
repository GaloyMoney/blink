import dotenv from "dotenv"
import { applyMiddleware } from "graphql-middleware"
import { or, shield } from "graphql-shield"

import { setupMongoConnection } from "@services/mongodb"
import { activateLndHealthCheck } from "@services/lnd/health"
import { baseLogger } from "@services/logger"

import { GALOY_API_PORT } from "@config"

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
        twoFAGenerate: isAuthenticated,
        twoFASave: isAuthenticated,
        twoFADelete: isAuthenticated,

        userQuizQuestionUpdateCompleted: isAuthenticated,
        deviceNotificationTokenCreate: isAuthenticated,

        accountApiKeyCreate: isAuthenticated,
        accountApiKeyDisable: isAuthenticated,

        userUpdateUsername: isAuthenticated,
        userUpdateLanguage: isAuthenticated,
        userContactUpdateAlias: isAuthenticated,

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
  return startApolloServer({
    schema,
    port: GALOY_API_PORT,
    startSubscriptionServer: true,
  })
}

if (require.main === module) {
  setupMongoConnection(false)
    .then(async () => {
      activateLndHealthCheck()
      await startApolloServerForCoreSchema()
    })
    .catch((err) => graphqlLogger.error(err, "server error"))
}
