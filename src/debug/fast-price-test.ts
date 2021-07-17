/**
 * how to run:
 * yarn ts-node src/debug/fast-price-test.ts
 */

import { Price } from "../priceImpl"
import { baseLogger } from "../logger"

const main = async () => {
  const price = new Price({ logger: baseLogger })
  // await price.fastUpdate()
  return await price.update()
}

main()
  .then((o) => console.log(o))
  .catch((err) => console.log(err))
