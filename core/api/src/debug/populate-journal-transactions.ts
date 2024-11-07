/**
 * how to run:
 * pnpm tsx src/debug/populate-journal-transactions.ts <starting_journal_id>
 */

import { setupMongoConnection } from "@/services/mongodb"
import { Transaction } from "@/services/ledger/schema"
import mongoose from "mongoose"

const Journal = mongoose.connection.models["Medici_Journal"]

const populateJournalTransactions = async (startingJournalId: string) => {
  console.log("Starting from journal ID:", startingJournalId)

  const journals = Journal.find({
    _id: { $gte: new mongoose.Types.ObjectId(startingJournalId) },
    $or: [{ _transactions: { $size: 0 } }, { _transactions: { $exists: false } }],
  }).cursor()

  let processedCount = 0
  let updatedCount = 0
  let startTime = Date.now()

  for await (const journal of journals) {
    processedCount++

    // Find transactions for this journal
    const transactions = await Transaction.find({ _journal: journal._id }, { _id: 1 })

    if (transactions.length <= 0) {
      console.error(`No transactions found for journal ${journal._id}`)
      continue
    }

    // Update journal
    const transactionIds = transactions.map((tx) => tx._id)
    await Journal.updateOne(
      { _id: journal._id },
      { $set: { _transactions: transactionIds } },
    )
    updatedCount++

    // Log progress every 100 journals
    if (processedCount % 100 === 0) {
      const timeElapsed = (Date.now() - startTime) / 1000
      console.log(`
        Processed: ${processedCount} journals
        Updated: ${updatedCount} journals
        Time elapsed: ${timeElapsed.toFixed(2)}s
        Current journal ID: ${journal._id}
      `)
    }
  }

  const totalTimeElapsed = (Date.now() - startTime) / 1000
  console.log(`
    Finished!
    Total processed: ${processedCount}
    Total updated: ${updatedCount}
    Total time: ${totalTimeElapsed.toFixed(2)}s
  `)

  return { processedCount, updatedCount }
}

const main = async () => {
  const args = process.argv.slice(-1)
  const startingJournalId = args[0]

  if (!startingJournalId) {
    console.error("Please provide a starting journal ID")
    process.exit(1)
  }

  try {
    const result = await populateJournalTransactions(startingJournalId)
    console.log("Result:", result)
  } catch (err) {
    console.error("Error:", err)
  }
}

setupMongoConnection()
  .then(async (mongoose) => {
    await main()
    if (mongoose) await mongoose.connection.close()
  })
  .catch((err) => console.log(err))
