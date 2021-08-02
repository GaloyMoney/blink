/**
 * how to run:
 * yarn ts-node src/debug/fast-price-test.ts
 */

import { baseLogger } from "@services/logger"
import { setupMongoConnectionSecondary } from "@services/mongodb"

import { Price } from "@core/price-impl"

const main = async () => {
  const mongoose = await setupMongoConnectionSecondary()
  const price = new Price({ logger: baseLogger })
  // await price.fastUpdate()
  const data = await price.update()
  await mongoose.connection.close()
  return data
}

main()
  .then((o) => console.log(o))
  .catch((err) => console.log(err))
