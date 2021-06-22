/**
 * @jest-environment node
 */
 import mongoose from "mongoose"
import { setupMongoConnection } from "../mongodb"
import { getUserWallet } from "./helper"
import { generateToken } from "node-2fa"
import { sleep } from "../utils"

jest.mock('../twilio')
jest.mock('../realtimePrice')

let userWallet0


beforeAll(async () => {
  await setupMongoConnection()
})

beforeEach(async () => {
  userWallet0 = await getUserWallet(0)
})

it('set 2fa for user0', async () => {
  const { secret } = await userWallet0.generate2fa()
  expect(!!secret).toBeTruthy()

  const token = generateToken(secret)?.token
  expect(await userWallet0.save2fa({ secret, token })).toBeTruthy()

  await sleep(1000)
  userWallet0 = await getUserWallet(0)
  console.log({user: userWallet0.user})
  expect(userWallet0.user.twoFactorSecret).toBeTruthy()
})

it('validate 2fa for user0', async () => {
  const token = generateToken(userWallet0.user.twoFactorSecret)?.token
  expect(userWallet0.validate2fa({token})).toBeTruthy()
})

it('delete 2fa for user0', async () => {
  const token = generateToken(userWallet0.user.twoFactorSecret)?.token
  const result = await userWallet0.delete2fa({token})
  expect(result).toBeTruthy()

  expect(userWallet0.user.twoFactorSecret).toBeFalsy()
})
