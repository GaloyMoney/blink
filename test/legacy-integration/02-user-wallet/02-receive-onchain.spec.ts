import { Wallets } from "@app"

import { getOnChainAddressCreateAttemptLimits } from "@config"

import { OnChainAddressCreateRateLimiterExceededError } from "@domain/rate-limit/errors"
import { ZERO_SATS } from "@domain/shared"
import { MultipleCurrenciesForSingleCurrencyOperationError } from "@domain/errors"

import { WalletsRepository } from "@services/mongoose"

import {
  bitcoindClient,
  checkIsBalanced,
  clearLimiters,
  createMandatoryUsers,
  createRandomUserAndBtcWallet,
  createUserAndWalletFromPhone,
  getAccountIdByPhone,
  getDefaultWalletIdByPhone,
  getUsdWalletIdByPhone,
  randomPhone,
  resetOnChainAddressAccountIdLimits,
  lndCreateOnChainAddress,
} from "test/helpers"

let walletIdA: WalletId
let walletIdUsdA: WalletId
let accountIdA: AccountId

let newAccountIdA: AccountId
let newWalletIdA: WalletId

const phoneA = randomPhone()
const phoneB = randomPhone()
const phoneC = randomPhone()

beforeAll(async () => {
  await createMandatoryUsers()

  await bitcoindClient.loadWallet({ filename: "outside" })

  await createUserAndWalletFromPhone(phoneA)
  await createUserAndWalletFromPhone(phoneB)
  await createUserAndWalletFromPhone(phoneC)

  walletIdA = await getDefaultWalletIdByPhone(phoneA)
  walletIdUsdA = await getUsdWalletIdByPhone(phoneA)
  accountIdA = await getAccountIdByPhone(phoneA)
  ;({ accountId: newAccountIdA, id: newWalletIdA } = await createRandomUserAndBtcWallet())
})

beforeEach(async () => {
  jest.resetAllMocks()

  await clearLimiters()

  // the randomness aim to ensure that we don't pass the test with 2 false negative
  // that could turn the result in a false positive
  // we could get rid of the random with a different amountSats for each test
})

afterEach(async () => {
  await checkIsBalanced()
})

afterAll(async () => {
  jest.restoreAllMocks()
  await bitcoindClient.unloadWallet({ walletName: "outside" })
})

describe("With Bria", () => {
  describe("UserWallet - On chain", () => {
    it.skip("fails to create onChain Address past rate limit", async () => {
      // Reset limits before starting
      let resetOk = await resetOnChainAddressAccountIdLimits(newAccountIdA)
      expect(resetOk).not.toBeInstanceOf(Error)
      if (resetOk instanceof Error) throw resetOk

      // Create max number of addresses
      const limitsNum = getOnChainAddressCreateAttemptLimits().points
      const promises: Promise<OnChainAddress | ApplicationError>[] = []
      for (let i = 0; i < limitsNum; i++) {
        const onChainAddressPromise = Wallets.createOnChainAddress({
          walletId: newWalletIdA,
        })
        promises.push(onChainAddressPromise)
      }
      const onChainAddresses = await Promise.all(promises)
      const isNotError = (item) => !(item instanceof Error)
      expect(onChainAddresses.every(isNotError)).toBe(true)

      // Test that first address past the limit fails
      const onChainAddress = await Wallets.createOnChainAddress({
        walletId: newWalletIdA,
      })
      expect(onChainAddress).toBeInstanceOf(OnChainAddressCreateRateLimiterExceededError)

      // Reset limits when done for other tests
      resetOk = await resetOnChainAddressAccountIdLimits(newAccountIdA)
      expect(resetOk).not.toBeInstanceOf(Error)
    })
  })
})

describe("With Lnd", () => {
  describe("UserWallet - On chain", () => {
    it.skip("fails to create onChain Address past rate limit", async () => {
      // Reset limits before starting
      let resetOk = await resetOnChainAddressAccountIdLimits(accountIdA)
      expect(resetOk).not.toBeInstanceOf(Error)
      if (resetOk instanceof Error) throw resetOk

      // Create max number of addresses
      const limitsNum = getOnChainAddressCreateAttemptLimits().points
      const promises: Promise<OnChainAddress | ApplicationError>[] = []
      for (let i = 0; i < limitsNum; i++) {
        const onChainAddressPromise = lndCreateOnChainAddress(walletIdA)
        promises.push(onChainAddressPromise)
      }
      const onChainAddresses = await Promise.all(promises)
      const isNotError = (item) => !(item instanceof Error)
      expect(onChainAddresses.every(isNotError)).toBe(true)

      // Test that first address past the limit fails
      const onChainAddress = await lndCreateOnChainAddress(walletIdA)
      expect(onChainAddress).toBeInstanceOf(OnChainAddressCreateRateLimiterExceededError)

      // Reset limits when done for other tests
      resetOk = await resetOnChainAddressAccountIdLimits(accountIdA)
      expect(resetOk).not.toBeInstanceOf(Error)
    })
  })
})

describe("Use cases", () => {
  describe("getPendingOnChainBalanceForWallets", () => {
    describe("with no pending incoming txns", () => {
      it("returns zero balance", async () => {
        const walletA = await WalletsRepository().findById(walletIdA)
        if (walletA instanceof Error) throw walletA

        const res = await Wallets.getPendingOnChainBalanceForWallets([walletA])
        expect(res).toStrictEqual({ [walletIdA]: ZERO_SATS })
      })

      it("returns error for mixed wallet currencies", async () => {
        const walletA = await WalletsRepository().findById(walletIdA)
        if (walletA instanceof Error) throw walletA
        const walletUsdA = await WalletsRepository().findById(walletIdUsdA)
        if (walletUsdA instanceof Error) throw walletUsdA

        const res = await Wallets.getPendingOnChainBalanceForWallets([
          walletA,
          walletUsdA,
        ])
        expect(res).toBeInstanceOf(MultipleCurrenciesForSingleCurrencyOperationError)
      })

      it("returns error for no wallets passed", async () => {
        const res = await Wallets.getPendingOnChainBalanceForWallets([])
        expect(res).toBeInstanceOf(MultipleCurrenciesForSingleCurrencyOperationError)
      })
    })
  })
})
