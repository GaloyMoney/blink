import difference from "lodash.difference"

import find from "lodash.find"

import { Payments } from "@/app"
import { MEMO_SHARING_SATS_THRESHOLD, OnboardingEarn } from "@/config"
import { getFunderWalletId } from "@/services/ledger/caching"
import { AccountsRepository, WalletsRepository } from "@/services/mongoose"

import {
  checkIsBalanced,
  createUserAndWalletFromPhone,
  getAccountIdByPhone,
  getDefaultWalletIdByPhone,
  getAccountRecordByPhone,
  randomPhone,
} from "test/helpers"
import { resetSelfAccountIdLimits } from "test/helpers/rate-limit"
import { getBalanceHelper, getTransactionsForWalletId } from "test/helpers/wallet"

let accountIdB: AccountId
let walletIdB: WalletId

const onBoardingEarnIds = [
  "whereBitcoinExist" as QuizQuestionId,
  "whyStonesShellGold" as QuizQuestionId,
  "NoCounterfeitMoney" as QuizQuestionId,
]
const onBoardingEarnAmt: number = Object.keys(OnboardingEarn)
  .filter((k) => find(onBoardingEarnIds, (o) => o === k))
  .reduce((p, k) => p + OnboardingEarn[k], 0)

jest.mock("@/config", () => {
  const config = jest.requireActual("@/config")
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

jest.mock("@/domain/accounts-ips/ip-metadata-authorizer", () => ({
  IPMetadataAuthorizer: () => ({
    authorize: () => true,
  }),
}))

jest.mock("@/domain/users", () => ({
  PhoneMetadataAuthorizer: () => ({
    authorize: () => true,
  }),
}))

const phone = randomPhone()

beforeAll(async () => {
  await createUserAndWalletFromPhone(phone)

  accountIdB = await getAccountIdByPhone(phone)
  walletIdB = await getDefaultWalletIdByPhone(phone)
})

afterAll(async () => {
  jest.restoreAllMocks()
})

describe("UserWallet - addEarn", () => {
  it("adds balance only once", async () => {
    const resetOk = await resetSelfAccountIdLimits(accountIdB)
    if (resetOk instanceof Error) throw resetOk

    const initialBalance = await getBalanceHelper(walletIdB)

    const accountRecordBBeforeEarn = await getAccountRecordByPhone(phone)

    const getAndVerifyRewards = async () => {
      for (const onBoardingEarnId of onBoardingEarnIds) {
        await Payments.addEarn({
          quizQuestionId: onBoardingEarnId as QuizQuestionId,
          accountId: accountIdB,
        })
      }
      const finalBalance = await getBalanceHelper(walletIdB)
      let rewards = onBoardingEarnAmt

      if (difference(onBoardingEarnIds, accountRecordBBeforeEarn.earn).length === 0) {
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
    const OnboardingEarnIds = Object.keys(OnboardingEarn)
    expect(OnboardingEarnIds.length).toBeGreaterThanOrEqual(1)

    const { result: transactionsBefore } = await getTransactionsForWalletId(walletIdB)

    let OnboardingEarnId = ""
    let txCheck: WalletTransaction | undefined
    for (OnboardingEarnId of OnboardingEarnIds) {
      txCheck = transactionsBefore?.slice.find((tx) => tx.memo === OnboardingEarnId)
      if (!txCheck) break
    }
    expect(txCheck).toBeUndefined()

    const amount = OnboardingEarn[OnboardingEarnId]
    expect(amount).toBeLessThan(MEMO_SHARING_SATS_THRESHOLD)

    const funderWalletId = await getFunderWalletId()
    const funderWallet = await WalletsRepository().findById(funderWalletId)
    if (funderWallet instanceof Error) throw funderWallet
    const funderAccount = await AccountsRepository().findById(funderWallet.accountId)
    if (funderAccount instanceof Error) throw funderAccount
    const payment = await Payments.intraledgerPaymentSendWalletIdForBtcWallet({
      senderWalletId: funderWalletId,
      senderAccount: funderAccount,
      recipientWalletId: walletIdB,
      amount,
      memo: OnboardingEarnId,
    })
    if (payment instanceof Error) return payment

    const { result: transactionsAfter } = await getTransactionsForWalletId(walletIdB)
    const rewardTx = transactionsAfter?.slice.find((tx) => tx.memo === OnboardingEarnId)
    expect(rewardTx).not.toBeUndefined()
  })
})
