import { getAndCreateUserWallet } from "test/helpers"

it("creating admin users", async () => {
  // load funder wallet before use it
  await getAndCreateUserWallet(4)

  // "bankowner" user
  await getAndCreateUserWallet(14)
})
