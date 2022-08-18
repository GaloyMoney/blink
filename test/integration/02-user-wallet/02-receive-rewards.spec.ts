import { Accounts, Payments, Wallets } from "@app"
import { MEMO_SHARING_SATS_THRESHOLD, onboardingEarn } from "@config"
import { getFunderWalletId } from "@services/ledger/caching"
import { AccountsRepository, WalletsRepository } from "@services/mongoose"
import difference from "lodash.difference"
import find from "lodash.find"

import {
  checkIsBalanced,
  createMandatoryUsers,
  createUserAndWalletFromUserRef,
  getAccountIdByTestUserRef,
  getDefaultWalletIdByTestUserRef,
  getUserRecordByTestUserRef,
} from "test/helpers"
import { resetSelfAccountIdLimits } from "test/helpers/rate-limit"
import { getBalanceHelper } from "test/helpers/wallet"

let accountIdB: AccountId
let walletIdB: WalletId

const onBoardingEarnIds = [
  "whereBitcoinExist" as QuizQuestionId,
  "whyStonesShellGold" as QuizQuestionId,
  "NoCounterfeitMoney" as QuizQuestionId,
]
const onBoardingEarnAmt: number = Object.keys(onboardingEarn)
  .filter((k) => find(onBoardingEarnIds, (o) => o === k))
  .reduce((p, k) => p + onboardingEarn[k], 0)

jest.mock("@config", () => {
  const config = jest.requireActual("@config")
  config.yamlConfig.rewards = {
    denyPhoneCountries: [],
    allowPhoneCountries: ["US"],
    denyIPCountries: [],
    allowIPCountries: [],
    denyASNs: [],
    allowASNs: [],
  }
  return config
})

beforeAll(async () => {
  await createUserAndWalletFromUserRef("B")

  accountIdB = await getAccountIdByTestUserRef("B")
  walletIdB = await getDefaultWalletIdByTestUserRef("B")

  await createMandatoryUsers()
})

afterAll(async () => {
  jest.restoreAllMocks()
})

describe("UserWallet - addEarn", () => {
  it("adds balance only once", async () => {
    const resetOk = await resetSelfAccountIdLimits(accountIdB)
    if (resetOk instanceof Error) throw resetOk

    const initialBalance = await getBalanceHelper(walletIdB)

    const userRecordBBeforeEarn = await getUserRecordByTestUserRef("B")

    const getAndVerifyRewards = async () => {
      const promises = onBoardingEarnIds.map((onBoardingEarnId) =>
        Accounts.addEarn({
          quizQuestionId: onBoardingEarnId as QuizQuestionId,
          accountId: accountIdB,
        }),
      )
      await Promise.all(promises)
      const finalBalance = await getBalanceHelper(walletIdB)
      let rewards = onBoardingEarnAmt

      if (difference(onBoardingEarnIds, userRecordBBeforeEarn.earn).length === 0) {
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

    const { result: transactionsBefore } = await Wallets.getTransactionsForWalletId({
      walletId: walletIdB,
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
    const funderWallet = await WalletsRepository().findById(funderWalletId)
    if (funderWallet instanceof Error) throw funderWallet
    const funderAccount = await AccountsRepository().findById(funderWallet.accountId)
    if (funderAccount instanceof Error) throw funderAccount
    const payment = await Payments.intraledgerPaymentSendWalletId({
      senderWalletId: funderWalletId,
      senderAccount: funderAccount,
      recipientWalletId: walletIdB,
      amount,
      memo: onboardingEarnId,
    })
    if (payment instanceof Error) return payment

    const { result: transactionsAfter } = await Wallets.getTransactionsForWalletId({
      walletId: walletIdB,
    })
    const rewardTx = transactionsAfter?.find((tx) => tx.memo === onboardingEarnId)
    expect(rewardTx).not.toBeUndefined()
  })
})
