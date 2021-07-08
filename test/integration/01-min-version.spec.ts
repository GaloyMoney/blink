/**
 * @jest-environment node
 */
import mongoose from "mongoose"
import { setupMongoConnection } from "src/mongodb"
import { DbMetadata } from "src/schema"

jest.mock("src/realtimePrice", () => require("../mocks/realtimePrice"))

it("set min version for graphql", async () => {
  await setupMongoConnection()
  await DbMetadata.create({ minBuildNumber: 200, lastBuildNumber: 200 })
  await mongoose.connection.close()
})
