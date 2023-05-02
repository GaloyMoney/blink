import { UsersRepository } from "@services/mongoose"

import { createUserAndWalletFromUserRef, getUserIdByTestUserRef } from "test/helpers"

let userId: UserId

beforeAll(async () => {
  await createUserAndWalletFromUserRef("A")
  userId = await getUserIdByTestUserRef("A")
})

describe("Accounts - update device", () => {
  it("updates successfully", async () => {
    const user = await UsersRepository().update({
      id: userId,
      device: "device12323432" as DeviceId,
    })
    expect(user).not.toBeInstanceOf(Error)
  })
})
