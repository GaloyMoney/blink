import { find, difference } from "lodash"
import { MS_PER_DAY, onboardingEarn } from "@config/app"
import { checkIsBalanced, getUserWallet } from "test/helpers"

jest.mock("@services/realtime-price", () => require("test/mocks/realtime-price"))
jest.mock("@services/phone-provider", () => require("test/mocks/phone-provider"))

let userWallet1

const earnsToGet = ["buyFirstSats", "debitCardActivation", "firstCardSpending"]
const onBoardingEarnAmt: number = Object.keys(onboardingEarn)
  .filter((k) => find(earnsToGet, (o) => o === k))
  .reduce((p, k) => p + onboardingEarn[k], 0)
const onBoardingEarnIds: string[] = earnsToGet

// required to avoid withdrawalLimit validation
const date = Date.now() + 2 * MS_PER_DAY
jest.spyOn(global.Date, "now").mockImplementation(() => new Date(date).valueOf())

beforeAll(async () => {
  userWallet1 = await getUserWallet(1)
  // load funder wallet before use it
  await getUserWallet(4)
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe("UserWallet - addEarn", () => {
  it("adds balance only once", async () => {
    const { BTC: initialBalance } = await userWallet1.getBalances()

    const getAndVerifyRewards = async () => {
      await userWallet1.addEarn(onBoardingEarnIds)
      const { BTC: finalBalance } = await userWallet1.getBalances()
      let rewards = onBoardingEarnAmt
      if (difference(onBoardingEarnIds, userWallet1.user.earn).length === 0) {
        rewards = 0
      }
      expect(finalBalance).toBe(initialBalance + rewards)
      await checkIsBalanced()
    }

    await getAndVerifyRewards()

    // yet, if we do it another time, the balance should not increase,
    // because all the rewards has already been been consumed:
    await getAndVerifyRewards()
  })
})
