import { MS_PER_DAY, onboardingEarn } from "@config/app"
import find from "lodash.find"
import difference from "lodash.difference"

import { addEarn } from "@app/accounts/add-earn"

import { baseLogger } from "@services/logger"

import { checkIsBalanced, getAndCreateUserWallet } from "test/helpers"
import { resetSelfWalletIdLimits } from "test/helpers/rate-limit"
import { getBTCBalance } from "test/helpers/wallet"

let userWallet1

const onBoardingEarnIds = [
  "whereBitcoinExist" as QuizQuestionId,
  "whyStonesShellGold" as QuizQuestionId,
  "NoCounterfeitMoney" as QuizQuestionId,
]
const onBoardingEarnAmt: number = Object.keys(onboardingEarn)
  .filter((k) => find(onBoardingEarnIds, (o) => o === k))
  .reduce((p, k) => p + onboardingEarn[k], 0)

// required to avoid withdrawalLimit validation
const date = Date.now() + 2 * MS_PER_DAY
jest.spyOn(global.Date, "now").mockImplementation(() => new Date(date).valueOf())

beforeAll(async () => {
  userWallet1 = await getAndCreateUserWallet(1)
  // load funder wallet before use it
  await getAndCreateUserWallet(4)
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe("UserWallet - addEarn", () => {
  it("adds balance only once", async () => {
    const resetOk = await resetSelfWalletIdLimits(userWallet1.user.walletId)
    expect(resetOk).not.toBeInstanceOf(Error)
    if (resetOk instanceof Error) throw resetOk

    const initialBalance = await getBTCBalance(userWallet1.user.walletId)

    const getAndVerifyRewards = async () => {
      const promises = onBoardingEarnIds.map((onBoardingEarnId) =>
        addEarn({
          quizQuestionId: onBoardingEarnId as QuizQuestionId,
          accountId: userWallet1.user._id,
          logger: baseLogger,
        }),
      )
      await Promise.all(promises)
      const finalBalance = await getBTCBalance(userWallet1.user.walletId)
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
