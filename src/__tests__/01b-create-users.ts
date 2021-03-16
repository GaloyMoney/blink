/**
 * @jest-environment node
 */
import { setupMongoConnection } from "../mongodb";
import { getUserWallet } from "./helper"
import { UserWallet } from "../userWallet"
import { insertMarkers } from "../debug/map_csv_to_mongodb"
import mongoose from "mongoose";
import { User } from "../schema";


let userWallet0, userWallet1, userWallet2


beforeAll(async () => {
  await setupMongoConnection()
})

afterAll(async () => {
	await mongoose.connection.close()
})


it('add user0/funder/Dealer', async () => {
  await getUserWallet(0)
  await getUserWallet(4)

  const dealer = await getUserWallet(6)
  expect(dealer.user.role).toBe("dealer")

  const user5 = await getUserWallet(5)
  expect(user5.user.currencies[0]).toMatchObject({id: "USD", ratio: 1})
})


const username = "user0"

describe('username tests', () => {
  beforeAll(async () => {
    userWallet0 = await getUserWallet(0)
    userWallet1 = await getUserWallet(1)
    userWallet2 = await getUserWallet(2)
  })

  it('does not set username if length less than 3', async () => {
    await expect(userWallet0.setUsername({ username: 'ab' })).rejects.toThrow()
  })

  it('does not set username if contains invalid characters', async () => {
    await expect(userWallet0.setUsername({ username: 'ab+/' })).rejects.toThrow()
  })

  it('does not allow non english characters', async () => {
    await expect(userWallet0.setUsername({ username: 'ñ_user1' })).rejects.toThrow()
  })

  it('cannot set user starting with 1, 3, bc1, lnbc1', async () => {
    await expect(userWallet0.setUsername({ username: "1ab" })).rejects.toThrow()
    await expect(userWallet0.setUsername({ username: "3basd" })).rejects.toThrow()
    await expect(userWallet0.setUsername({ username: "bc1ba" })).rejects.toThrow()
    await expect(userWallet0.setUsername({ username: "lnbc1qwe1" })).rejects.toThrow()
  })

  it('sets username for user0', async () => {
    const result = await userWallet0.setUsername({ username: "user0" })
    expect(!!result).toBeTruthy()
  })
  
  it('sets username for user1', async () => {
    const result = await userWallet1.setUsername({ username: "user1" })
    expect(!!result).toBeTruthy()
  })

  it('does not set username with only case difference', async () => {
    await expect(userWallet2.setUsername({ username: 'User1' })).rejects.toThrow()
  })

  it('sets username for user2', async () => {
    const result = await userWallet2.setUsername({ username: "lily" })
    expect(!!result).toBeTruthy()

    
    expect(userWallet2.user.title).toBeTruthy()
  })

  it('does not allow re-setting username', async () => {
    await expect(userWallet0.setUsername({ username: "abc" })).rejects.toThrow()
  })

  it('usernameExists returns true if username already exists', async () => {
    const result = await UserWallet.usernameExists({ username })
    expect(result).toBe(true)
  })

  it('usernameExists returns true for other capitalization', async () => {
    const result = await UserWallet.usernameExists({ username })
    expect(result).toBe(true)
  })

  it('usernameExists returns true if username already exists', async () => {
    const result = await UserWallet.usernameExists({ username: username.toLocaleUpperCase() })
    expect(result).toBe(true)
  })

  it('"user" should not match', async () => {
    const result = await User.exists({ username: "user" })
    expect(result).toBeFalsy()
  })

  it('does not set username if already taken', async () => {
    const userWallet2 = await getUserWallet(2)
    await expect(userWallet2.setUsername({ username })).rejects.toThrow()
  })

})




