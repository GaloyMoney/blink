/**
 * how to run:
 * . ./.envrc && yarn ts-node --files -r tsconfig-paths/register src/debug/update-on-chain-receipt.ts
 */

import { Wallets } from "@app"
import { baseLogger as logger } from "@services/logger"
import { checkedToScanDepth } from "@domain/bitcoin/onchain"
import { redis } from "@services/redis"
import { setupMongoConnection } from "@services/mongodb"

const updateOnChainReceipt = async () => {
  const scanDepth = checkedToScanDepth(2160) // ~15 days
  if (scanDepth instanceof Error) throw scanDepth

  console.warn(`Updating onchain receipt for ${scanDepth} blocks`)

  const mongoose = await setupMongoConnection()
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
