/**
 * how to run:
 *
 * pnpm tsx src/debug/reset-user-totp.ts <user id>
 *
 * <user id>: ID of the user whose TOTP needs to be reset
 */

import { Authentication } from "@/app"

import { setupMongoConnection } from "@/services/mongodb"

const main = async () => {
  const args = process.argv.slice(-1)
  const userId = args[0] as UserId

  if (!userId) {
    console.error("Error: User ID is required")
    return
  }

  const result = await Authentication.removeTotp({ userId })
  if (result instanceof Error) {
    console.error("Error:", result)
    return
  }
  console.log(`Successfully reset TOTP for user ${userId}:`, result)
}

setupMongoConnection()
  .then(async (mongoose) => {
    await main()
    if (mongoose) await mongoose.connection.close()
  })
  .catch((err) => console.log(err))
