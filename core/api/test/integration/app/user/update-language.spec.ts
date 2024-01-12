import { Users } from "@/app"
import { InvalidLanguageError } from "@/domain/errors"

import { createUserAndWalletFromPhone, getUserIdByPhone, randomPhone } from "test/helpers"

let userId: UserId
const phone = randomPhone()

beforeAll(async () => {
  await createUserAndWalletFromPhone(phone)
  userId = await getUserIdByPhone(phone)
})

describe("UserUpdateLanguage", () => {
  it("fails with invalid language", async () => {
    const result = await Users.updateLanguage({
      userId: userId,
      language: "Klingon",
    })
    expect(result).toBeInstanceOf(InvalidLanguageError)
  })
})
