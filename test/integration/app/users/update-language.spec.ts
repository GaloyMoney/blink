import { Users } from "@app"
import { InvalidLanguageError } from "@domain/errors"
import { UsersRepository } from "@services/mongoose"

import { createUserAndWalletFromUserRef, getUserIdByTestUserRef } from "test/helpers"

let userId: UserId

beforeAll(async () => {
  await createUserAndWalletFromUserRef("A")
  userId = await getUserIdByTestUserRef("A")
})

describe("Accounts - updateLanguage", () => {
  it("updates successfully", async () => {
    const result = await Users.updateLanguage({
      userId: userId,
      language: "es",
    })
    expect(result).not.toBeInstanceOf(Error)
    expect(result).toEqual(
      expect.objectContaining({
        id: userId,
        language: "es",
      }),
    )

    await Users.updateLanguage({ userId, language: "de" })

    const user = await UsersRepository().findById(userId)
    expect(user).not.toBeInstanceOf(Error)
    expect(user).toEqual(
      expect.objectContaining({
        id: userId,
        language: "de",
      }),
    )
  })

  it("fails with invalid language", async () => {
    const result = await Users.updateLanguage({
      userId: userId,
      language: "Klingon",
    })
    expect(result).toBeInstanceOf(InvalidLanguageError)
  })
})
