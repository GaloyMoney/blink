import { setupMongoConnection } from "src/mongodb"
import { DbMetadata } from "src/schema"

it("should set min version for graphql", async () => {
  const mongoose = await setupMongoConnection()
  await DbMetadata.create({ minBuildNumber: 200, lastBuildNumber: 200 })
  await mongoose.connection.close()
})
