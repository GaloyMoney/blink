import { startApolloServerForAdminSchema } from "./graphql-admin-api-server"

import { startApolloServerForCoreSchema } from "./graphql-public-api-server"

import { bootstrap } from "@/app/bootstrap"
import { activateLndHealthCheck } from "@/services/lnd/health"
import { baseLogger } from "@/services/logger"
import { setupMongoConnection } from "@/services/mongodb"

setupMongoConnection(true)
  .then(async () => {
    activateLndHealthCheck()

    const res = await bootstrap()
    if (res instanceof Error) throw res

    await Promise.race([
      startApolloServerForCoreSchema(),
      startApolloServerForAdminSchema(),
    ])
  })
  .catch((err) => baseLogger.error(err, "server error"))
