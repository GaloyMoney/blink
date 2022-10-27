import dotenv from "dotenv"
import { applyMiddleware } from "graphql-middleware"
import { shield } from "graphql-shield"

import { setupMongoConnection } from "@services/mongodb"
import { activateLndHealthCheck } from "@services/lnd/health"
import { baseLogger } from "@services/logger"

import { GALOY_API_PORT } from "@config"

import { gqlMainSchema } from "../graphql"

import { isAuthenticated, startApolloServer } from "./graphql-server"
import { walletIdMiddleware } from "./middlewares/wallet-id"

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
        deviceNotificationTokenCreate: isAuthenticated,

        userUpdateUsername: isAuthenticated,
        userUpdateLanguage: isAuthenticated,
        accountUpdateDefaultWalletId: isAuthenticated,
        userContactUpdateAlias: isAuthenticated,

        lnInvoiceFeeProbe: isAuthenticated,
        lnNoAmountInvoiceFeeProbe: isAuthenticated,

        lnInvoiceCreate: isAuthenticated,
        lnUsdInvoiceCreate: isAuthenticated,
        lnNoAmountInvoiceCreate: isAuthenticated,

        lnInvoicePaymentSend: isAuthenticated,
        lnNoAmountInvoicePaymentSend: isAuthenticated,
        lnNoAmountUsdInvoicePaymentSend: isAuthenticated,

        intraLedgerPaymentSend: isAuthenticated,
        intraLedgerUsdPaymentSend: isAuthenticated,

        onChainAddressCreate: isAuthenticated,
        onChainAddressCurrent: isAuthenticated,
        onChainPaymentSend: isAuthenticated,
        onChainPaymentSendAll: isAuthenticated,
      },
    },
    { allowExternalErrors: true },
  )

  const schema = applyMiddleware(gqlMainSchema, permissions, walletIdMiddleware)
  return startApolloServer({
    schema,
    port: GALOY_API_PORT,
    startSubscriptionServer: true,
    type: "main",
  })
}

if (require.main === module) {
  setupMongoConnection(true)
    .then(async () => {
      activateLndHealthCheck()
      await startApolloServerForCoreSchema()
    })
    .catch((err) => graphqlLogger.error(err, "server error"))
}
