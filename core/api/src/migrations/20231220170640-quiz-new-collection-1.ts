/* eslint @typescript-eslint/ban-ts-comment: "off" */
// @ts-nocheck
async function migrateAccounts(db, batchSize = 100) {
  const cursor = db.collection("accounts").find()

  let batchCount = 0
  while (await cursor.hasNext()) {
    const quizUpdates = []
    for (let i = 0; i < batchSize && (await cursor.hasNext()); i++) {
      const account = await cursor.next()
      const uniqueEarn = [...new Set(account.earn)]
      for (const quizId of uniqueEarn) {
        quizUpdates.push({
          insertOne: {
            accountId: account.id,
            quizId,
            createAt: new Date(),
          },
        })
      }
    }

    batchCount += quizUpdates.length

    if (quizUpdates.length > 0) {
      await db.collection("quizzes").bulkWrite(quizUpdates)
      console.log(`Processed ${batchCount} accounts`)
    }
  }

  console.log(`Processed ${batchCount} accounts`)
}

module.exports = {
  async up(db) {
    await db
      .collection("quizzes")
      .createIndex({ accountId: 1, quizId: 1 }, { unique: true })

    console.log("Begin migration to Quiz collection")
    await migrateAccounts(db)
    console.log("Migration completed")
  },
}
