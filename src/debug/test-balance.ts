/**
 * how to run:
 *
 * . ./.envrc && yarn ts-node --files -r tsconfig-paths/register src/debug/void-payment.ts <payment hash>
 *
 * <payment hash>: payment hash to void. Must be the last param
 */
import { setupMongoConnection } from "@services/mongodb"
import { MainBook } from "@services/ledger/books"

console.log("begin")

const main = async () => {
  console.log("main")

  const ledger = await MainBook.ledger({ account: "Liabilities", currency: "BTC" })
  const balance = await MainBook.balance({ account: "Liabilities", currency: "BTC" })

  console.log(ledger)
  console.log(balance)

  console.log("end")
}

setupMongoConnection()
  .then(async (mongoose) => {
    await main()
    if (mongoose) await mongoose.connection.close()
  })
  .catch((err) => console.log(err))
