/**
 * how to run:
 *	. ./.envrc && yarn ts-node \
 *		--files \
 *			-r tsconfig-paths/register \
 *			-r src/services/tracing.ts \
 *		src/debug/revert-tx.ts <txId>
 */

import { isUp } from "@services/lnd/health"
import { lndsConnect } from "@services/lnd/auth"

import { setupMongoConnection } from "@services/mongodb"
import { baseLogger } from "@services/logger"

import { MainBook, Transaction } from "@services/ledger/books"

const TX_ID = process.argv[2]

const main = async (): Promise<true | ApplicationError> => {
  baseLogger.info(`Started script for txId: ${TX_ID}`)

  const tx = await Transaction.findOne({ _id: TX_ID })
  if (!tx) throw new Error(`Transaction ${TX_ID} not found`)
  const journalId = tx._journal.toString()

  await MainBook.void(journalId, "Buggy payment")

  return true
}

setupMongoConnection(false)
  .then(async (mongoose) => {
    await Promise.all(lndsConnect.map((lndParams) => isUp(lndParams)))
    await main()
    if (mongoose) await mongoose.connection.close()
  })
  .catch((err) => console.log(err))
