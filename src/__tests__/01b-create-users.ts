/**
 * @jest-environment node
 */
const lnService = require('ln-service')
import { setupMongoConnection, User } from "../mongodb";
import { getTestUserToken } from "../tests/helper";
import { TEST_NUMBER } from "../text";
const mongoose = require("mongoose");


// change role to admin
// FIXME there should be an API for this
export async function promoteToAdmin(uid) {
  await User.findOneAndUpdate({_id: uid}, {role: "admin"})
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

  const token = await getTestUserToken(0)
  expect(token.currency).toBe("BTC")
})


it('add admin', async () => {  
  const {uid} = await getTestUserToken(4)
  await promoteToAdmin(uid)
})


it('add user5 / usd user', async () => {  
  const user5 = await getTestUserToken(5)
  expect(user5.currency).toBe("USD")

  const user6 = await getTestUserToken(6)
  expect(user6.currency).toBe("BTC")

  expect(user5.uid).not.toBe(user6.uid)
  
  const phoneUser5 = await User.findOne({_id: user5.uid}, {phone: 1, _id: 0})
  const phoneUser6 = await User.findOne({_id: user6.uid}, {phone: 1, _id: 0})
  expect(phoneUser5).toStrictEqual(phoneUser6)
})


