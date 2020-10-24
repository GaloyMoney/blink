/**
 * @jest-environment node
 */
import { quit } from "../lock";
import { setupMongoConnection } from "../mongodb";
import { getUserWallet } from "../tests/helper";

const lnService = require('ln-service')
const mongoose = require("mongoose")

let userWallet

beforeAll(async () => {
  await setupMongoConnection()
  userWallet = await getUserWallet(0)
});

afterAll(async () => {
  await mongoose.connection.close()
  await quit()
});

it('export account to csv', async () => {
  await userWallet.getStringCsv()
})
