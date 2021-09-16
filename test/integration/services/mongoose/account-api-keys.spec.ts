import { hashApiKey, randomApiKey } from "@domain/accounts"
import { CouldNotFindError } from "@domain/errors"
import { AccountApiKeysRepository } from "@services/mongoose"

const repo = AccountApiKeysRepository()
const delta = 30 // days
const expireAt = new Date(Date.now())
expireAt.setDate(expireAt.getDate() + delta)

const createTestHash = async () => {
  const apiKey = await randomApiKey(expireAt)
  if (apiKey instanceof Error) throw apiKey

  const hashedKey = await hashApiKey(apiKey)
  if (hashedKey instanceof Error) throw hashedKey

  return { apiKey, hashedKey }
}

describe("AccountApiKeys", () => {
  it("persists and finds an api key", async () => {
    const accountId = "accId" as AccountId
    const { apiKey, hashedKey: hashToPersist } = await createTestHash()
    const label = apiKey.key.substring(0, 6)
    const persistResult = await repo.persistNew(accountId, label, hashToPersist, expireAt)
    expect(persistResult).not.toBeInstanceOf(Error)

    const saved = persistResult as AccountApiKey
    const lookedUpApiKey = await repo.findByHashedKey(saved.hashedKey)
    const expectedApiKey = {
      accountId,
      label,
      hashedKey: hashToPersist,
      expireAt,
    }
    expect(lookedUpApiKey).not.toBeInstanceOf(Error)
    expect(lookedUpApiKey).toEqual(expectedApiKey)

    const apiKeys = await repo.listByAccountId(accountId)
    expect(apiKeys).not.toBeInstanceOf(Error)
    expect(apiKeys).toContainEqual(expectedApiKey)
  })

  it("disable an api key by label", async () => {
    const accountId = "accIdDisable" as AccountId
    const { apiKey, hashedKey: hashToPersist } = await createTestHash()
    const label = apiKey.key.substring(0, 6)
    const persistResult = await repo.persistNew(accountId, label, hashToPersist, expireAt)
    expect(persistResult).not.toBeInstanceOf(Error)

    const saved = persistResult as AccountApiKey
    let lookedUpApiKey = await repo.findByHashedKey(saved.hashedKey)
    expect(lookedUpApiKey).not.toBeInstanceOf(Error)

    let apiKeys = await repo.listByAccountId(accountId)
    expect(apiKeys).not.toBeInstanceOf(Error)
    expect(apiKeys).toContainEqual(
      expect.objectContaining({
        accountId,
        hashedKey: hashToPersist,
      }),
    )

    const disabled = await repo.disableByLabel(accountId, label)
    expect(disabled).not.toBeInstanceOf(Error)

    lookedUpApiKey = await repo.findByHashedKey(saved.hashedKey)
    expect(lookedUpApiKey).toBeInstanceOf(CouldNotFindError)

    apiKeys = await repo.listByAccountId(accountId)
    expect(apiKeys).not.toContainEqual(
      expect.objectContaining({
        accountId,
        hashedKey: hashToPersist,
      }),
    )
  })

  it("fails to find if expired api key", async () => {
    const accountId = "accId" as AccountId
    const expireAt = new Date(Date.now() - 1)
    const { apiKey, hashedKey: hashToPersist } = await createTestHash()
    const label = apiKey.key.substring(0, 6)
    const persistResult = await repo.persistNew(accountId, label, hashToPersist, expireAt)
    expect(persistResult).not.toBeInstanceOf(Error)

    const saved = persistResult as AccountApiKey
    const lookedUpApiKey = await repo.findByHashedKey(saved.hashedKey)
    expect(lookedUpApiKey).toBeInstanceOf(CouldNotFindError)

    const apiKeys = await repo.listByAccountId(accountId)
    expect(apiKeys).not.toBeInstanceOf(Error)
    expect(apiKeys).not.toEqual(
      expect.objectContaining({
        accountId,
        hashedKey: hashToPersist,
      }),
    )
  })

  it("fails to list if account has not api keys", async () => {
    const accountId = "accId1" as AccountId
    const apiKeys = await repo.listByAccountId(accountId)
    expect(apiKeys).toBeInstanceOf(CouldNotFindError)
  })
})
