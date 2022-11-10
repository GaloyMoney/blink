/**
 * how to run:
 * yarn ts-node --files -r tsconfig-paths/register src/debug/create-usd-wallets.ts
 */

import { isUp } from "@services/lnd/health"
import { params as unauthParams } from "@services/lnd/unauth"
import { setupMongoConnection } from "@services/mongodb"
import { Account } from "@services/mongoose/schema"

const MigrateUserMetadata = async () => {
  try {
    const res = Account.updateMany(
      {},
      { $unset: { phone: 1, phoneMetadata: 1 } },
      { multi: true },
    )
    console.log({ res }, `update contactEnabled`)
  } catch (error) {
    console.log({ error }, `error removing phone`)
  }

  console.log("completed")
}

const main = async () => {
  return MigrateUserMetadata()
}

setupMongoConnection()
  .then(async (mongoose) => {
    await Promise.all(unauthParams.map((lndParams) => isUp(lndParams)))
    await main()
    return mongoose.connection.close()
  })
  .catch((err) => console.log(err))
