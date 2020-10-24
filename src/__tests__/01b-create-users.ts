/**
 * @jest-environment node
 */
const lnService = require('ln-service')
import { setupMongoConnection, User } from "../mongodb";
import { TEST_NUMBER } from "../text";
import { getUserWallet } from "../tests/helper"
import { createBrokerUid, getTokenFromPhoneIndex } from "../walletFactory";
const mongoose = require("mongoose");


// change role to admin
// FIXME there should be an API for this
export async function promoteToFunder(uid) {
  await User.findOneAndUpdate({ _id: uid }, { role: "funder" })
}

beforeAll(async () => {
  await setupMongoConnection()
})

afterAll(async () => {
	await mongoose.connection.close()
})


it('add user0 without currency (old account)', async () => {
  // TODO: query to add `currency` for exising users
  await User.findOneAndUpdate({}, { phone: TEST_NUMBER[0].phone }, { upsert: true })
  await User.updateMany({}, { $set: { currency: "BTC" } })

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

  const phoneUser5 = await User.findOne({ _id: user5.uid }, { phone: 1, _id: 0 })
  const phoneUser6 = await User.findOne({ _id: user6.uid }, { phone: 1, _id: 0 })
  expect(phoneUser5).toStrictEqual(phoneUser6)
})

const username = "user1"

it('sets username for user', async () => {
  const userWallet = await getUserWallet(1)
  const result = await userWallet.setUsername({username})
  expect(!!result).toBeTruthy()
})

it('does not set username when it already exists', async () => {
  const userWallet = await getUserWallet(1)
  const result = await userWallet.setUsername({username: "abc"})
  expect(!!result).toBeFalsy()
})

it('does not set username if already taken', async () => {
  const userWallet2 = await getUserWallet(2)
  const result = await userWallet2.setUsername({username})
  expect(!!result).toBeFalsy()
})
