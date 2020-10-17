/**
 * @jest-environment node
 */
const lnService = require('ln-service')
import { setupMongoConnection, User } from "../mongodb";
import { TEST_NUMBER } from "../text";
import { createBrokerUid, getTokenFromPhoneIndex } from "../walletFactory";
const mongoose = require("mongoose");


// change role to admin
// FIXME there should be an API for this
export async function promoteToFunder(uid) {
  await User.findOneAndUpdate({_id: uid}, {role: "funder"})
}

beforeAll(async () => {
  await setupMongoConnection()
})

afterAll(async () => {
	await mongoose.connection.close()
})


it('add user0 without currency (old account)', async () => {
  // TODO: query to add `currency` for exising users
  await User.findOneAndUpdate({}, {phone: TEST_NUMBER[0].phone}, {upsert:true})
  await User.updateMany({}, {$set: {currency: "BTC"}})

  const token = await getTokenFromPhoneIndex(0)
  expect(token.currency).toBe("BTC")
})


it('add Funder', async () => {  
  const {uid} = await getTokenFromPhoneIndex(4)
  await promoteToFunder(uid)
})

it('add Broker', async () => {  
  await createBrokerUid()
})

it('add user5 / usd user', async () => {  
  const user5 = await getTokenFromPhoneIndex(5)
  expect(user5.currency).toBe("USD")

  const user6 = await getTokenFromPhoneIndex(6)
  expect(user6.currency).toBe("BTC")

  expect(user5.uid).not.toBe(user6.uid)
  
  const phoneUser5 = await User.findOne({_id: user5.uid}, {phone: 1, _id: 0})
  const phoneUser6 = await User.findOne({_id: user6.uid}, {phone: 1, _id: 0})
  expect(phoneUser5).toStrictEqual(phoneUser6)
})


