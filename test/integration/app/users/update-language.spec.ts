import { Users } from "@app"
import { InvalidLanguageError } from "@domain/errors"

import { createUserWallet, getUserIdByTestUserIndex } from "test/helpers"

let userId0: UserId

beforeAll(async () => {
  await createUserWallet(0)
  userId0 = await getUserIdByTestUserIndex(0)
})

describe("Users - updateLanguage", () => {
  it("updates successfully", async () => {
    const result = await Users.updateLanguage({ userId: userId0, language: "es" })
    expect(result).not.toBeInstanceOf(Error)
    expect(result).toEqual(
      expect.objectContaining({
        id: userId0,
        language: "es",
      }),
    )

    await Users.updateLanguage({ userId: userId0, language: "en" })
    const user = await Users.getUser(userId0)
    expect(user).not.toBeInstanceOf(Error)
    expect(user).toEqual(
      expect.objectContaining({
        id: userId0,
        language: "en",
      }),
    )
  })

  it("fails with invalid language", async () => {
    const result = await Users.updateLanguage({ userId: userId0, language: "ru" })
    expect(result).toBeInstanceOf(InvalidLanguageError)
  })
})
