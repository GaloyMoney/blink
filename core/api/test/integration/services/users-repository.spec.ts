import { DuplicateKeyForPersistError } from "@/domain/errors"
import { UsersRepository } from "@/services/mongoose"

import { randomUserId, randomPhone } from "test/helpers"

const users = UsersRepository()

describe("Users Repository", () => {
  it("return default value if userId doesn't exist", async () => {
    const userId = randomUserId()

    const user = await users.findById(userId)
    if (user instanceof Error) throw user
    expect(user.id).toBe(userId)
  })

  it("can create entity with update", async () => {
    const userId = randomUserId()

    const user = await users.update({ id: userId })
    if (user instanceof Error) throw user
    expect(user.id).toBe(userId)

    const user2 = await users.findById(userId)
    if (user2 instanceof Error) throw user
    expect(user2.id).toBe(userId)
  })

  it("can't create 2 entities with same phone", async () => {
    const userId1 = randomUserId()
    const userId2 = randomUserId()
    const phone = randomPhone()

    const user = await users.update({ id: userId1, phone })
    if (user instanceof Error) throw user
    expect(user.id).toBe(userId1)

    const user2 = await users.update({ id: userId2, phone })
    expect(user2).toBeInstanceOf(DuplicateKeyForPersistError)
  })

  it("updating one field doesn't change the other fields", async () => {
    const userId = randomUserId()

    const deviceTokens = ["token"] as DeviceToken[]

    const user0 = await users.findById(userId)
    if (user0 instanceof Error) throw user0
    expect(user0.id).toBe(userId)

    const user = await users.update({ id: userId, deviceTokens })
    if (user instanceof Error) throw user
    expect(user.deviceTokens).toStrictEqual(deviceTokens)
    expect(user.id).toBe(userId)

    expect(user.language).toBe(user0.language)
    expect(user.phoneMetadata).toBe(user0.phoneMetadata)

    const user2 = await users.update({ ...user, language: "es" })
    if (user2 instanceof Error) throw user2
    expect(user2.deviceTokens).toStrictEqual(deviceTokens)
    expect(user2.language).toBe("es")
  })
})
