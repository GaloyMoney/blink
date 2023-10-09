import { randomUUID } from "crypto"

import { Accounts, Wallets } from "@/app"

import { AccountStatus } from "@/domain/accounts"
import { RateLimitConfig } from "@/domain/rate-limit"
import { InactiveAccountError } from "@/domain/errors"
import {
  OnChainAddressCreateRateLimiterExceededError,
  RateLimiterExceededError,
} from "@/domain/rate-limit/errors"

import { AccountsRepository } from "@/services/mongoose"
import * as RateLimitImpl from "@/services/rate-limit"

import { createRandomUserAndBtcWallet } from "test/helpers"

const updatedByPrivilegedClientId = randomUUID() as PrivilegedClientId

describe("onChainAddress", () => {
  it("can apply requestId as idempotency key when creating new address", async () => {
    const newWalletDescriptor = await createRandomUserAndBtcWallet()
    const newAccount = await AccountsRepository().findById(newWalletDescriptor.accountId)
    if (newAccount instanceof Error) throw newAccount

    const requestId = ("requestId #" +
      (Math.random() * 1_000_000).toFixed()) as OnChainAddressRequestId

    const address = await Wallets.createOnChainAddress({
      walletId: newWalletDescriptor.id,
      requestId,
    })

    const retryCreateAddressWithRequestId = await Wallets.createOnChainAddress({
      walletId: newWalletDescriptor.id,
      requestId,
    })
    expect(retryCreateAddressWithRequestId).toBe(address)

    const retryCreateAddress = await Wallets.createOnChainAddress({
      walletId: newWalletDescriptor.id,
    })
    expect(retryCreateAddress).not.toBe(address)
  })

  it("fails if account is locked", async () => {
    const newWalletDescriptor = await createRandomUserAndBtcWallet()
    const newAccount = await AccountsRepository().findById(newWalletDescriptor.accountId)
    if (newAccount instanceof Error) throw newAccount

    // Lock account
    const updatedAccount = await Accounts.updateAccountStatus({
      accountId: newAccount.id,
      status: AccountStatus.Locked,
      updatedByPrivilegedClientId,
    })
    if (updatedAccount instanceof Error) throw updatedAccount
    expect(updatedAccount.status).toEqual(AccountStatus.Locked)

    // Create address attempt
    const res = await Wallets.createOnChainAddress({
      walletId: newWalletDescriptor.id,
    })
    expect(res).toBeInstanceOf(InactiveAccountError)
  })

  it("fails if rate limit is met", async () => {
    const newWalletDescriptor = await createRandomUserAndBtcWallet()
    const newAccount = await AccountsRepository().findById(newWalletDescriptor.accountId)
    if (newAccount instanceof Error) throw newAccount

    // Setup limiter mock
    const { RedisRateLimitService } = jest.requireActual("@/services/rate-limit")
    const rateLimitServiceSpy = jest
      .spyOn(RateLimitImpl, "RedisRateLimitService")
      .mockReturnValue({
        ...RedisRateLimitService({
          keyPrefix: RateLimitConfig.onChainAddressCreate.key,
          limitOptions: RateLimitConfig.onChainAddressCreate.limits,
        }),
        consume: () => new RateLimiterExceededError(),
      })

    // Create address attempt
    const res = await Wallets.createOnChainAddress({
      walletId: newWalletDescriptor.id,
    })
    expect(res).toBeInstanceOf(OnChainAddressCreateRateLimiterExceededError)

    // Restore system state
    rateLimitServiceSpy.mockReset()
  })
})
