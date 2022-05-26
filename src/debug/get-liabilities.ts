/**
 *How to run
 * . ./.envrc && yarn ts-node --files -r tsconfig-paths/register src/debug/get-liabilities.ts
 */

import { setupMongoConnection } from "@services/mongodb"
import { createTree } from "@app/proof-of-liabilities/create-tree"

// export const getLiabilities = async () => {
//   const liabilities = await createTree()
//   return liabilities
// }

const main = async () => {
  const result = await createTree()
  if (result instanceof Error) {
    console.error("Error:", result)
    return
  }
  console.log(result)
}

setupMongoConnection()
  .then(async (mongoose) => {
    await main()
    if (mongoose) await mongoose.connection.close()
  })
  .catch((err) => console.log(err))
