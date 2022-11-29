/**
 * how to run:
 * yarn ts-node --files -r tsconfig-paths/register src/debug/create-usd-wallets.ts
 */

import { setupMongoConnection } from "@services/mongodb"
import { Account } from "@services/mongoose/schema"

const migrateUserMetadata = async () => {
  try {
    const res = Account.updateMany(
      {},
      { $unset: { phone: 1, phoneMetadata: 1, language: 1, deviceTokens: 1 } },
      { multi: true },
    )
    console.log({ res }, `removing deprecated fields`)
  } catch (error) {
    console.log({ error }, `error removing deprecated fields`)
  }

  console.log("completed")
}

setupMongoConnection()
  .then(async (mongoose) => {
    await migrateUserMetadata()
    return mongoose.connection.close()
  })
  .catch((err) => console.log(err))
