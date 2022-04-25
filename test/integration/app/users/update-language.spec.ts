import { Users } from "@app"
import { InvalidLanguageError } from "@domain/errors"

import { createUserAndWalletFromUserRef, getUserIdByTestUserRef } from "test/helpers"

let userIdA: UserId

beforeAll(async () => {
  await createUserAndWalletFromUserRef("A")
  userIdA = await getUserIdByTestUserRef("A")
})

describe("Users - updateLanguage", () => {
  it("updates successfully", async () => {
    const result = await Users.updateLanguage({ userId: userIdA, language: "es" })
    expect(result).not.toBeInstanceOf(Error)
    expect(result).toEqual(
      expect.objectContaining({
        id: userIdA,
        language: "es",
      }),
    )

    await Users.updateLanguage({ userId: userIdA, language: "en" })
    const user = await Users.getUser(userIdA)
    expect(user).not.toBeInstanceOf(Error)
    expect(user).toEqual(
      expect.objectContaining({
        id: userIdA,
        language: "en",
      }),
    )
  })

  it("fails with invalid language", async () => {
    const result = await Users.updateLanguage({ userId: userIdA, language: "Klingon" })
    expect(result).toBeInstanceOf(InvalidLanguageError)
  })
})
