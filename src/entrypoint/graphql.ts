import { baseLogger } from "../logger"
import { setupMongoConnection } from "../mongodb"
import { startApolloServerForSchema } from "./graphql-core-server"
import { activateLndHealthCheck } from "../lndHealth"

const graphqlLogger = baseLogger.child({ module: "graphql" })

if (require.main === module) {
  setupMongoConnection()
    .then(async () => {
      await startApolloServerForSchema()
      activateLndHealthCheck()
    })
    .catch((err) => graphqlLogger.error(err, "server error"))
}
