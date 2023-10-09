/* eslint @typescript-eslint/ban-ts-comment: "off" */
// @ts-nocheck
/* eslint @typescript-eslint/no-var-requires: "off" */
const getUuidByString = require("uuid-by-string")

async function migrateAccounts(db, batchSize = 100) {
  const cursor = db.collection("accounts").find()

  let batchCount = 0
  while (await cursor.hasNext()) {
    const batchUpdates = []
    for (let i = 0; i < batchSize && (await cursor.hasNext()); i++) {
      const account = await cursor.next()
      const id = account.uuid || getUuidByString(account._id.toString())
      batchUpdates.push({
        updateOne: {
          filter: { _id: account._id },
          update: { $set: { id }, $unset: { uuid: 1 } },
        },
      })
    }

    batchCount += batchUpdates.length

    if (batchUpdates.length > 0) {
      await db.collection("accounts").bulkWrite(batchUpdates)
      console.log(`Processed ${batchCount} accounts`)
    }
  }

  console.log(`Added UUIDs to ${batchCount} accounts`)
}

module.exports = {
  /* eslint @typescript-eslint/ban-ts-comment: "off" */
  // @ts-ignore-next-line no-implicit-any error
  async up(db) {
    console.log("Begin migration to add UUIDs to Accounts Schema")
    await migrateAccounts(db)
    console.log("Migration to add UUIDs to Accounts Schema completed")
  },

  async down() {
    console.log(`Rollback of add uuid to Account Schema migration not needed`)
  },
}
