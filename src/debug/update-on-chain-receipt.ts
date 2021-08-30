/**
 * how to run:
 * . ./.envrc && yarn ts-node --files -r tsconfig-paths/register src/debug/update-on-chain-receipt.ts
 */

import * as Wallets from "@app/wallets"
import { baseLogger as logger } from "@services/logger"
import { setupMongoConnectionSecondary } from "@services/mongodb"
import { redis } from "@services/redis"

const updateOnChainReceipt = async () => {
  const scanDepth = 2160 // ~15 days
  console.warn(`Updating onchain receipt for ${scanDepth} blocks`)

  const mongoose = await setupMongoConnectionSecondary()
  const txNumber = await Wallets.updateOnChainReceipt({ scanDepth, logger })
  if (txNumber instanceof Error) {
    throw txNumber
  }

  await mongoose.connection.close()
  redis.disconnect()

  return txNumber
}

updateOnChainReceipt()
  .then((o) => console.log(`Finish updating onchain receipt with ${o} transactions`))
  .catch((err) => console.log(err))
