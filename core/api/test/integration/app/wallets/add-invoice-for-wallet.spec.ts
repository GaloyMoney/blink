import { randomUUID } from "crypto"

import { Accounts, Wallets } from "@/app"

import { AccountStatus } from "@/domain/accounts"
import { InactiveAccountError } from "@/domain/errors"

import { AccountsRepository } from "@/services/mongoose"
import * as LndImpl from "@/services/lnd"
import * as RateLimitImpl from "@/services/rate-limit"

import { createRandomUserAndBtcWallet, createRandomUserAndWallets } from "test/helpers"
import { RateLimitConfig } from "@/domain/rate-limit"

const amountSats = 1000
const amountCents = 20

afterEach(async () => {
  jest.restoreAllMocks()
})

describe("addInvoice", () => {
  it("fails for self if account is locked", async () => {
    const newWalletDescriptor = await createRandomUserAndBtcWallet()
    const newAccount = await AccountsRepository().findById(newWalletDescriptor.accountId)
    if (newAccount instanceof Error) throw newAccount

    const updatedByPrivilegedClientId = randomUUID() as PrivilegedClientId

    // Lock account
    const updatedAccount = await Accounts.updateAccountStatus({
      accountId: newAccount.id,
      status: AccountStatus.Locked,
      updatedByPrivilegedClientId,
    })
    if (updatedAccount instanceof Error) throw updatedAccount
    expect(updatedAccount.status).toEqual(AccountStatus.Locked)

    // Add invoice for self attempt
    const selfRes = await Wallets.addInvoiceNoAmountForSelfForAnyWallet({
      walletId: newWalletDescriptor.id,
      externalId: undefined,
    })
    expect(selfRes).toBeInstanceOf(InactiveAccountError)

    // Create invoice for recipient attempt
    const recipientRes = await Wallets.addInvoiceNoAmountForRecipientForAnyWallet({
      recipientWalletId: newWalletDescriptor.id,
      externalId: undefined,
    })
    expect(recipientRes).toBeInstanceOf(InactiveAccountError)
  })

  describe("RedisRateLimitService", () => {
    describe("invoiceCreate", () => {
      it("calls rate limit check for addInvoiceForSelfForBtcWallet", async () => {
        // Setup mocks
        const { LndService: LnServiceOrig } = jest.requireActual("@/services/lnd")
        jest.spyOn(LndImpl, "LndService").mockReturnValue({
          ...LnServiceOrig(),
          registerInvoice: () => ({
            invoice: {
              paymentHash: undefined,
            },
          }),
        })

        const consumeLimiterSpy = jest.spyOn(RateLimitImpl, "consumeLimiter")

        const consume = jest.fn()
        const { RedisRateLimitService: RedisRateLimitServiceOrig } = jest.requireActual(
          "@/services/rate-limit",
        )
        const redisRateLimitServiceSpy = jest
          .spyOn(RateLimitImpl, "RedisRateLimitService")
          .mockReturnValue({
            ...RedisRateLimitServiceOrig,
            consume,
          })

        // Add invoice and check calls
        const newWalletDescriptor = await createRandomUserAndBtcWallet()
        await Wallets.addInvoiceForSelfForBtcWallet({
          walletId: newWalletDescriptor.id,
          amount: amountSats,
          externalId: undefined,
        })

        const { keyPrefix } = redisRateLimitServiceSpy.mock.calls[0][0]
        expect(keyPrefix).toBe(RateLimitConfig.invoiceCreate.key)

        const { keyToConsume } = consumeLimiterSpy.mock.calls[0][0]
        expect(consume).toHaveBeenCalledTimes(1)
        const consumedKey = consume.mock.calls[0][0]
        expect(consumedKey).toBe(keyToConsume)
      })

      it("calls rate limit check for addInvoiceForSelfForUsdWallet", async () => {
        // Setup mocks
        const { LndService: LnServiceOrig } = jest.requireActual("@/services/lnd")
        jest.spyOn(LndImpl, "LndService").mockReturnValue({
          ...LnServiceOrig(),
          registerInvoice: () => ({
            invoice: {
              paymentHash: undefined,
            },
          }),
        })

        const consumeLimiterSpy = jest.spyOn(RateLimitImpl, "consumeLimiter")

        const consume = jest.fn()
        const { RedisRateLimitService: RedisRateLimitServiceOrig } = jest.requireActual(
          "@/services/rate-limit",
        )
        const redisRateLimitServiceSpy = jest
          .spyOn(RateLimitImpl, "RedisRateLimitService")
          .mockReturnValue({
            ...RedisRateLimitServiceOrig,
            consume,
          })

        // Add invoice and check calls
        const { usdWalletDescriptor: newWalletDescriptor } =
          await createRandomUserAndWallets()
        await Wallets.addInvoiceForSelfForUsdWallet({
          walletId: newWalletDescriptor.id,
          amount: amountCents,
          externalId: undefined,
        })

        const { keyPrefix } = redisRateLimitServiceSpy.mock.calls[0][0]
        expect(keyPrefix).toBe(RateLimitConfig.invoiceCreate.key)

        const { keyToConsume } = consumeLimiterSpy.mock.calls[0][0]
        expect(consume).toHaveBeenCalledTimes(1)
        const consumedKey = consume.mock.calls[0][0]
        expect(consumedKey).toBe(keyToConsume)
      })

      it("calls rate limit check for addInvoiceNoAmountForSelf", async () => {
        // Setup mocks
        const { LndService: LnServiceOrig } = jest.requireActual("@/services/lnd")
        jest.spyOn(LndImpl, "LndService").mockReturnValue({
          ...LnServiceOrig(),
          registerInvoice: () => ({
            invoice: {
              paymentHash: undefined,
            },
          }),
        })

        const consumeLimiterSpy = jest.spyOn(RateLimitImpl, "consumeLimiter")

        const consume = jest.fn()
        const { RedisRateLimitService: RedisRateLimitServiceOrig } = jest.requireActual(
          "@/services/rate-limit",
        )
        const redisRateLimitServiceSpy = jest
          .spyOn(RateLimitImpl, "RedisRateLimitService")
          .mockReturnValue({
            ...RedisRateLimitServiceOrig,
            consume,
          })

        // Add invoice and check calls
        const newWalletDescriptor = await createRandomUserAndBtcWallet()
        await Wallets.addInvoiceNoAmountForSelfForAnyWallet({
          walletId: newWalletDescriptor.id,
          externalId: undefined,
        })

        const { keyPrefix } = redisRateLimitServiceSpy.mock.calls[0][0]
        expect(keyPrefix).toBe(RateLimitConfig.invoiceCreate.key)

        const { keyToConsume } = consumeLimiterSpy.mock.calls[0][0]
        expect(consume).toHaveBeenCalledTimes(1)
        const consumedKey = consume.mock.calls[0][0]
        expect(consumedKey).toBe(keyToConsume)
      })
    })
  })

  describe("invoiceCreateForRecipient", () => {
    it("calls rate limit check for addInvoiceForRecipientForBtcWallet", async () => {
      // Setup mocks
      const { LndService: LnServiceOrig } = jest.requireActual("@/services/lnd")
      jest.spyOn(LndImpl, "LndService").mockReturnValue({
        ...LnServiceOrig(),
        registerInvoice: () => ({
          invoice: {
            paymentHash: undefined,
          },
        }),
      })

      const consumeLimiterSpy = jest.spyOn(RateLimitImpl, "consumeLimiter")

      const consume = jest.fn()
      const { RedisRateLimitService: RedisRateLimitServiceOrig } = jest.requireActual(
        "@/services/rate-limit",
      )
      const redisRateLimitServiceSpy = jest
        .spyOn(RateLimitImpl, "RedisRateLimitService")
        .mockReturnValue({
          ...RedisRateLimitServiceOrig,
          consume,
        })

      // Add invoice and check calls
      const newWalletDescriptor = await createRandomUserAndBtcWallet()
      await Wallets.addInvoiceForRecipientForBtcWallet({
        recipientWalletId: newWalletDescriptor.id,
        amount: amountSats,
        externalId: undefined,
      })

      const { keyPrefix } = redisRateLimitServiceSpy.mock.calls[0][0]
      expect(keyPrefix).toBe(RateLimitConfig.invoiceCreateForRecipient.key)

      const { keyToConsume } = consumeLimiterSpy.mock.calls[0][0]
      expect(consume).toHaveBeenCalledTimes(1)
      const consumedKey = consume.mock.calls[0][0]
      expect(consumedKey).toBe(keyToConsume)
    })

    it("calls rate limit check for addInvoiceForRecipientForUsdWallet", async () => {
      // Setup mocks
      const { LndService: LnServiceOrig } = jest.requireActual("@/services/lnd")
      jest.spyOn(LndImpl, "LndService").mockReturnValue({
        ...LnServiceOrig(),
        registerInvoice: () => ({
          invoice: {
            paymentHash: undefined,
          },
        }),
      })

      const consumeLimiterSpy = jest.spyOn(RateLimitImpl, "consumeLimiter")

      const consume = jest.fn()
      const { RedisRateLimitService: RedisRateLimitServiceOrig } = jest.requireActual(
        "@/services/rate-limit",
      )
      const redisRateLimitServiceSpy = jest
        .spyOn(RateLimitImpl, "RedisRateLimitService")
        .mockReturnValue({
          ...RedisRateLimitServiceOrig,
          consume,
        })

      // Add invoice and check calls
      const { usdWalletDescriptor: newWalletDescriptor } =
        await createRandomUserAndWallets()
      await Wallets.addInvoiceForRecipientForUsdWallet({
        recipientWalletId: newWalletDescriptor.id,
        amount: amountCents,
        externalId: undefined,
      })

      const { keyPrefix } = redisRateLimitServiceSpy.mock.calls[0][0]
      expect(keyPrefix).toBe(RateLimitConfig.invoiceCreateForRecipient.key)

      const { keyToConsume } = consumeLimiterSpy.mock.calls[0][0]
      expect(consume).toHaveBeenCalledTimes(1)
      const consumedKey = consume.mock.calls[0][0]
      expect(consumedKey).toBe(keyToConsume)
    })

    it("calls rate limit check for addInvoiceForRecipientForUsdWalletAndBtcAmount", async () => {
      // Setup mocks
      const { LndService: LnServiceOrig } = jest.requireActual("@/services/lnd")
      jest.spyOn(LndImpl, "LndService").mockReturnValue({
        ...LnServiceOrig(),
        registerInvoice: () => ({
          invoice: {
            paymentHash: undefined,
          },
        }),
      })

      const consumeLimiterSpy = jest.spyOn(RateLimitImpl, "consumeLimiter")

      const consume = jest.fn()
      const { RedisRateLimitService: RedisRateLimitServiceOrig } = jest.requireActual(
        "@/services/rate-limit",
      )
      const redisRateLimitServiceSpy = jest
        .spyOn(RateLimitImpl, "RedisRateLimitService")
        .mockReturnValue({
          ...RedisRateLimitServiceOrig,
          consume,
        })

      // Add invoice and check calls
      const { usdWalletDescriptor: newWalletDescriptor } =
        await createRandomUserAndWallets()
      await Wallets.addInvoiceForRecipientForUsdWalletAndBtcAmount({
        recipientWalletId: newWalletDescriptor.id,
        amount: amountSats,
        externalId: undefined,
      })

      const { keyPrefix } = redisRateLimitServiceSpy.mock.calls[0][0]
      expect(keyPrefix).toBe(RateLimitConfig.invoiceCreateForRecipient.key)

      const { keyToConsume } = consumeLimiterSpy.mock.calls[0][0]
      expect(consume).toHaveBeenCalledTimes(1)
      const consumedKey = consume.mock.calls[0][0]
      expect(consumedKey).toBe(keyToConsume)
    })

    it("calls rate limit check for addInvoiceNoAmountForRecipientForAnyWallet", async () => {
      // Setup mocks
      const { LndService: LnServiceOrig } = jest.requireActual("@/services/lnd")
      jest.spyOn(LndImpl, "LndService").mockReturnValue({
        ...LnServiceOrig(),
        registerInvoice: () => ({
          invoice: {
            paymentHash: undefined,
          },
        }),
      })

      const consumeLimiterSpy = jest.spyOn(RateLimitImpl, "consumeLimiter")

      const consume = jest.fn()
      const { RedisRateLimitService: RedisRateLimitServiceOrig } = jest.requireActual(
        "@/services/rate-limit",
      )
      const redisRateLimitServiceSpy = jest
        .spyOn(RateLimitImpl, "RedisRateLimitService")
        .mockReturnValue({
          ...RedisRateLimitServiceOrig,
          consume,
        })

      // Add invoice and check calls
      const newWalletDescriptor = await createRandomUserAndBtcWallet()
      await Wallets.addInvoiceNoAmountForRecipientForAnyWallet({
        recipientWalletId: newWalletDescriptor.id,
        externalId: undefined,
      })

      const { keyPrefix } = redisRateLimitServiceSpy.mock.calls[0][0]
      expect(keyPrefix).toBe(RateLimitConfig.invoiceCreateForRecipient.key)

      const { keyToConsume } = consumeLimiterSpy.mock.calls[0][0]
      expect(consume).toHaveBeenCalledTimes(1)
      const consumedKey = consume.mock.calls[0][0]
      expect(consumedKey).toBe(keyToConsume)
    })
  })
})
