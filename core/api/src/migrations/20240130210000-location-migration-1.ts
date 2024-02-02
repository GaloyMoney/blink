/* eslint @typescript-eslint/ban-ts-comment: "off" */
// @ts-nocheck
// ignore error below @typescript-eslint/no-var-requires
// eslint-disable-next-line @typescript-eslint/no-var-requires
const nodeCrypto = require("crypto")

async function migrateAccounts(db, batchSize = 100) {
  const cursor = db.collection("accounts").find({ title: { $exists: true } })

  let batchCount = 0
  while (await cursor.hasNext()) {
    const merchantUpdates = []
    for (let i = 0; i < batchSize && (await cursor.hasNext()); i++) {
      const account = await cursor.next()
      merchantUpdates.push({
        insertOne: {
          id: nodeCrypto.randomUUID(),
          username: account.username,
          title: account.title,
          location: {
            type: "Point",
            coordinates: [account.coordinates.longitude, account.coordinates.latitude],
          },
          createdAt: account.created_at,
          validated: true,
        },
      })
    }

    batchCount += merchantUpdates.length

    if (merchantUpdates.length > 0) {
      await db.collection("merchants").bulkWrite(merchantUpdates)
      console.log(`Processed ${batchCount} accounts`)
    }
  }

  console.log(`Processed ${batchCount} accounts`)
}

module.exports = {
  async up(db) {
    await db
      .collection("merchants")
      .createIndex({ location: "2dsphere" }, { background: true })

    console.log("Begin migration")
    await migrateAccounts(db)
    console.log("Migration completed")
  },
}
