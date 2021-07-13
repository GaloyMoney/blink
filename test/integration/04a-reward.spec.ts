/**
 * @jest-environment node
 */
import { setupMongoConnection } from "src/mongodb"
import { checkIsBalanced, getUserWallet, mockGetExchangeBalance } from "test/helpers"
import { OnboardingEarn } from "src/types"
import { find } from "lodash"

const earnsToGet = ["buyFirstSats", "debitCardActivation", "firstCardSpending"]
export const onBoardingEarnAmt: number = Object.keys(OnboardingEarn)
  .filter((k) => find(earnsToGet, (o) => o === k))
  .reduce((p, k) => p + OnboardingEarn[k], 0)
export const onBoardingEarnIds: string[] = earnsToGet

import mongoose from "mongoose"

let userWallet1

jest.mock("src/notifications/notification")
jest.mock("src/realtimePrice", () => require("test/mocks/realtimePrice"))

beforeAll(async () => {
  await setupMongoConnection()
  mockGetExchangeBalance()
  userWallet1 = await getUserWallet(1)
})

beforeEach(async () => {
  await userWallet1.getBalances()
  jest.clearAllMocks()
})

afterEach(async () => {
  await checkIsBalanced()
})

afterAll(async () => {
  // to make this test re-entrant, we need to remove the fund from userWallet1 and delete the user
  // uncomment when necessary

  // const finalBalance = await userWallet1.getBalances()
  // const funderWallet = await getFunderWallet({ logger: baseLogger })

  // if (!!finalBalance) {
  //   const request = await funderWallet.addInvoice({ value: finalBalance })
  //   await userWallet1.pay({ invoice: request })
  // }

  // await User.findOneAndRemove({ _id: userWallet1.uid })

  jest.restoreAllMocks()

  await mongoose.connection.close()
})

it("add earn adds balance correctly", async () => {
  const getAndVerifyRewards = async () => {
    await userWallet1.addEarn(onBoardingEarnIds)
    const { BTC: finalBalance } = await userWallet1.getBalances()

    expect(finalBalance).toBe(onBoardingEarnAmt)
    await checkIsBalanced()
  }

  await getAndVerifyRewards()

  // yet, if we do it another time, the balance should not increase,
  // because all the rewards has already been been consumed:
  await getAndVerifyRewards()
})
