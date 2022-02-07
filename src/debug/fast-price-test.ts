/**
 * how to run:
 * yarn ts-node src/debug/fast-price-test.ts
 */

import { setupMongoConnection } from "@services/mongodb"
import { updatePriceHistory } from "@services/price/update-price-history"

const main = async () => {
  const mongoose = await setupMongoConnection()
  const data = await updatePriceHistory()
  await mongoose.connection.close()
  return data
}

main()
  .then((o) => console.log(o))
  .catch((err) => console.log(err))
