import dotenv from "dotenv"
import { applyMiddleware } from "graphql-middleware"
import { shield } from "graphql-shield"

import { setupMongoConnection } from "@services/mongodb"
import { activateLndHealthCheck } from "@services/lnd/health"
import { baseLogger } from "@services/logger"
import { startApolloServer } from "./graphql-server"
import { gqlSchema } from "../graphql"

const graphqlLogger = baseLogger.child({ module: "graphql" })

dotenv.config()

export async function startApolloServerForCoreSchema() {
  const permissions = shield(
    {
      // Query: {},
      // Mutation: {},
      // Subscription: {},
    },
    { allowExternalErrors: true },
  )

  const schema = applyMiddleware(gqlSchema, permissions)
  return await startApolloServer({ schema, port: 4002, startSubscriptionServer: true })
}

if (require.main === module) {
  setupMongoConnection()
    .then(async () => {
      await startApolloServerForCoreSchema()
      activateLndHealthCheck()
    })
    .catch((err) => graphqlLogger.error(err, "server error"))
}
