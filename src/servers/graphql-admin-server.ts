import dotenv from "dotenv"
import { applyMiddleware } from "graphql-middleware"
import { and, shield } from "graphql-shield"
import { ILogicRule } from "graphql-shield/dist/types"

import { baseLogger } from "@services/logger"
import { setupMongoConnection } from "@services/mongodb"

import { activateLndHealthCheck } from "@services/lnd/health"

import { GALOY_ADMIN_PORT, getAccountsConfig } from "@config"

import { gqlAdminSchema } from "../graphql"

import { startApolloServer, isAuthenticated, isEditor } from "./graphql-server"

dotenv.config()

const graphqlLogger = baseLogger.child({ module: "graphql" })

export async function startApolloServerForAdminSchema() {
  const mutations: Record<string, ILogicRule> = {
    accountUpdateLevel: and(isAuthenticated, isEditor),
    accountUpdateStatus: and(isAuthenticated, isEditor),
    accountsAddUsdWallet: and(isAuthenticated, isEditor),
    businessUpdateMapInfo: and(isAuthenticated, isEditor),
    coldStorageRebalanceToHotWallet: and(isAuthenticated, isEditor),
  }

  const { customFields } = getAccountsConfig()
  if (customFields && customFields.length > 0) {
    mutations["accountCustomFieldsUpdate"] = and(isAuthenticated, isEditor)
  }

  const ruleTree = {
    Query: {
      allLevels: and(isAuthenticated, isEditor),
      accountDetailsByUserPhone: and(isAuthenticated, isEditor),
      accountDetailsByUsername: and(isAuthenticated, isEditor),
      transactionById: and(isAuthenticated, isEditor),
      transactionsByHash: and(isAuthenticated, isEditor),
      lightningInvoice: and(isAuthenticated, isEditor),
      lightningPayment: and(isAuthenticated, isEditor),
      wallet: and(isAuthenticated, isEditor),
      listWalletIds: and(isAuthenticated, isEditor),
    },
    Mutation: mutations,
  }

  const permissions = shield(ruleTree, { allowExternalErrors: true })
  const schema = applyMiddleware(gqlAdminSchema, permissions)
  return startApolloServer({ schema, port: GALOY_ADMIN_PORT, type: "admin" })
}

if (require.main === module) {
  setupMongoConnection()
    .then(async () => {
      activateLndHealthCheck()
      await startApolloServerForAdminSchema()
    })
    .catch((err) => graphqlLogger.error(err, "server error"))
}
