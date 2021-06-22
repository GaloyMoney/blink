/**
 * @jest-environment node
 */
import mongoose from "mongoose"
import { setupMongoConnection } from "../mongodb"
import { DbMetadata } from "../schema"

jest.mock("../realtimePrice")

it("set min version for graphql", async () => {
  await setupMongoConnection()
  await DbMetadata.create({ minBuildNumber: 200, lastBuildNumber: 200 })
  await mongoose.connection.close()
})
