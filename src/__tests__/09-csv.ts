/**
 * @jest-environment node
 */
import { setupMongoConnection } from "../mongodb"
import { getUserWallet } from "./helper"
import mongoose from "mongoose"
jest.mock("../realtimePrice")

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
