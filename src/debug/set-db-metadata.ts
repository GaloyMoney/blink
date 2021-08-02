/**
 * how to run:
 * yarn ts-node src/debug/set-db-metadata.ts
 */

import { setupMongoConnectionSecondary } from "@services/mongodb"
import { DbMetadata } from "@services/mongoose/schema"

const main = async () => {
  const mongoose = await setupMongoConnectionSecondary()
  // sets min version for graphql (required by mobile app)
  const data = await DbMetadata.create({ minBuildNumber: 200, lastBuildNumber: 200 })
  await mongoose.connection.close()
  return data
}

main()
  .then((o) => console.log(o))
  .catch((err) => console.log(err))
