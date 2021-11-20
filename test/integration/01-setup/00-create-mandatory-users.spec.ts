import { getAndCreateUserWallet } from "test/helpers"

jest.mock("@services/phone-provider", () => require("test/mocks/phone-provider"))

it("creating admin users", async () => {
  // load funder wallet before use it
  await getAndCreateUserWallet(4)

  // "bankowner" user
  await getAndCreateUserWallet(14)
})
