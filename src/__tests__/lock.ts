import { setupMongoConnection } from "../mongodb"
// this import needs to be before medici

import { FiatAdminWallet } from "../FiatAdminWallet"

beforeAll(async () => {
  await setupMongoConnection()
});

afterAll(async () => {
  return await mongoose.connection.close()
});

it('acquire a lock', async () => {

})

