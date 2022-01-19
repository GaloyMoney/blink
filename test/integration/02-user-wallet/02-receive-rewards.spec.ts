import { addEarn } from "@app/accounts/add-earn"
import { getTransactionsForWalletId, intraledgerPaymentSendWalletId } from "@app/wallets"
import { MEMO_SHARING_SATS_THRESHOLD, MS_PER_DAY, onboardingEarn } from "@config/app"
import { getFunderWalletId } from "@services/ledger/accounts"
import { baseLogger } from "@services/logger"
import difference from "lodash.difference"
import find from "lodash.find"

import {
  checkIsBalanced,
  createMandatoryUsers,
  createUserWallet,
  getAccountIdByTestUserIndex,
  getDefaultWalletIdByTestUserIndex,
  getUserRecordByTestUserIndex,
} from "test/helpers"
import { resetSelfAccountIdLimits } from "test/helpers/rate-limit"
import { getBTCBalance } from "test/helpers/wallet"

let accountId1: AccountId
let walletId1: WalletId

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
  await createUserWallet(1)

  accountId1 = await getAccountIdByTestUserIndex(1)
  walletId1 = await getDefaultWalletIdByTestUserIndex(1)

  await createMandatoryUsers()
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe("UserWallet - addEarn", () => {
  it("adds balance only once", async () => {
    const resetOk = await resetSelfAccountIdLimits(accountId1)
    expect(resetOk).not.toBeInstanceOf(Error)
    if (resetOk instanceof Error) throw resetOk

    const initialBalance = await getBTCBalance(walletId1)

    const userType1BeforeEarn = await getUserRecordByTestUserIndex(1)

    const getAndVerifyRewards = async () => {
      const promises = onBoardingEarnIds.map((onBoardingEarnId) =>
        addEarn({
          quizQuestionId: onBoardingEarnId as QuizQuestionId,
          accountId: accountId1,
          logger: baseLogger,
        }),
      )
      await Promise.all(promises)
      const finalBalance = await getBTCBalance(walletId1)
      let rewards = onBoardingEarnAmt

      if (difference(onBoardingEarnIds, userType1BeforeEarn.earn).length === 0) {
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

  it("receives transaction with reward memo", async () => {
    const onboardingEarnIds = Object.keys(onboardingEarn)
    expect(onboardingEarnIds.length).toBeGreaterThanOrEqual(1)

    const { result: transactionsBefore } = await getTransactionsForWalletId({
      walletId: walletId1,
    })

    let onboardingEarnId = ""
    let txCheck: WalletTransaction | undefined
    for (onboardingEarnId of onboardingEarnIds) {
      txCheck = transactionsBefore?.find((tx) => tx.memo === onboardingEarnId)
      if (!txCheck) break
    }
    expect(txCheck).toBeUndefined()

    const amount = onboardingEarn[onboardingEarnId]
    expect(amount).toBeLessThan(MEMO_SHARING_SATS_THRESHOLD)

    const funderWalletId = await getFunderWalletId()
    const payment = await intraledgerPaymentSendWalletId({
      senderWalletId: funderWalletId,
      recipientWalletId: walletId1,
      amount,
      memo: onboardingEarnId,
      logger: baseLogger,
    })
    if (payment instanceof Error) return payment

    const { result: transactionsAfter } = await getTransactionsForWalletId({
      walletId: walletId1,
    })
    const rewardTx = transactionsAfter?.find((tx) => tx.memo === onboardingEarnId)
    expect(rewardTx).not.toBeUndefined()
  })
})
