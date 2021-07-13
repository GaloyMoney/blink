/**
 * @jest-environment node
 */
import { setupMongoConnection } from "src/mongodb"
import { getUserWallet } from "test/helpers"
import mongoose from "mongoose"
jest.mock("src/realtimePrice", () => require("test/mocks/realtimePrice"))

let userWallet

beforeAll(async () => {
  await setupMongoConnection()
  userWallet = await getUserWallet(0)
})

afterAll(async () => {
  await mongoose.connection.close()
})

it("export account to csv", async () => {
  await userWallet.getStringCsv()
})
