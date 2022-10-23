import { Users } from "@app"
import { InvalidLanguageError } from "@domain/errors"
import { UsersRepository } from "@services/mongoose/users"

import { createUserAndWalletFromUserRef, getUserIdByTestUserRef } from "test/helpers"

let kratosUserId: KratosUserId

beforeAll(async () => {
  await createUserAndWalletFromUserRef("A")
  kratosUserId = await getUserIdByTestUserRef("A")
})

describe("Accounts - updateLanguage", () => {
  it("updates successfully", async () => {
    const result = await Users.updateLanguage({
      kratosUserId: kratosUserId,
      language: "es",
    })
    expect(result).not.toBeInstanceOf(Error)
    expect(result).toEqual(
      expect.objectContaining({
        id: kratosUserId,
        language: "es",
      }),
    )

    await Users.updateLanguage({ kratosUserId, language: "de" })

    const user = await UsersRepository().findById(kratosUserId)
    expect(user).not.toBeInstanceOf(Error)
    expect(user).toEqual(
      expect.objectContaining({
        id: kratosUserId,
        language: "de",
      }),
    )
  })

  it("fails with invalid language", async () => {
    const result = await Users.updateLanguage({
      kratosUserId: kratosUserId,
      language: "Klingon",
    })
    expect(result).toBeInstanceOf(InvalidLanguageError)
  })
})
