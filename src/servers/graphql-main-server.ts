import dotenv from "dotenv"
import { applyMiddleware } from "graphql-middleware"
import { shield } from "graphql-shield"

import { setupMongoConnection } from "@services/mongodb"
import { activateLndHealthCheck } from "@services/lnd/health"
import { baseLogger } from "@services/logger"
import { isAuthenticated, startApolloServer } from "./graphql-server"
import { gqlMainSchema } from "../graphql"

const graphqlLogger = baseLogger.child({ module: "graphql" })

dotenv.config()

export async function startApolloServerForCoreSchema() {
  const permissions = shield(
    {
      Query: {
        me: isAuthenticated,
        onChainTxFee: isAuthenticated,
      },
      Mutation: {
        userQuizQuestionUpdateCompleted: isAuthenticated,
        userUpdateLanguage: isAuthenticated,
        walletContactUpdateAlias: isAuthenticated,

        twoFAGenerate: isAuthenticated,
        twoFASave: isAuthenticated,
        twoFADelete: isAuthenticated,

        deviceNotificationTokenCreate: isAuthenticated,

        accountApiKeyCreate: isAuthenticated,
        accountApiKeyDisable: isAuthenticated,

        lnInvoiceFeeProbe: isAuthenticated,
        lnNoAmountInvoiceFeeProbe: isAuthenticated,

        lnInvoiceCreate: isAuthenticated,
        lnNoAmountInvoiceCreate: isAuthenticated,

        lnInvoicePaymentSend: isAuthenticated,
        lnNoAmountInvoicePaymentSend: isAuthenticated,

        intraLedgerPaymentSend: isAuthenticated,

        onChainAddressCreate: isAuthenticated,
        onChainAddressCurrent: isAuthenticated,
        onChainPaymentSend: isAuthenticated,
        onChainPaymentSendAll: isAuthenticated,
      },
      // Subscription: {},
    },
    { allowExternalErrors: true },
  )

  const schema = applyMiddleware(gqlMainSchema, permissions)
  return startApolloServer({ schema, port: 4002, startSubscriptionServer: true })
}

if (require.main === module) {
  setupMongoConnection()
    .then(async () => {
      await startApolloServerForCoreSchema()
      activateLndHealthCheck()
    })
    .catch((err) => graphqlLogger.error(err, "server error"))
}
