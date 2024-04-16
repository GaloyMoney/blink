/* eslint @typescript-eslint/ban-ts-comment: "off" */

// @ts-ignore-next-line no-implicit-any error
async function migrateInvoices(db, batchSize = 100) {
  const cursor = db.collection("invoiceusers").find()

  let batchCount = 0
  while (await cursor.hasNext()) {
    const batchUpdates = []
    for (let i = 0; i < batchSize && (await cursor.hasNext()); i++) {
      const invoice = await cursor.next()
      if (invoice.externalId) continue

      batchUpdates.push({
        updateOne: {
          filter: { _id: invoice._id, externalId: { $exists: false } },
          update: { $set: { externalId: invoice._id, migratedExternalId: true } },
        },
      })
    }

    batchCount += batchUpdates.length

    if (batchUpdates.length > 0) {
      await db.collection("invoiceusers").bulkWrite(batchUpdates)
      console.log(`Processed ${batchCount} invoices`)
    }
  }

  console.log(`Added external ids to ${batchCount} invoices`)
}

module.exports = {
  // @ts-ignore-next-line no-implicit-any error
  async up(db) {
    console.log("Begin migration to add external ids to Invoice Users Schema")
    await migrateInvoices(db)
    console.log("Migration to add external ids to Invoice Users Schema completed")
  },

  // @ts-ignore-next-line no-implicit-any error
  async down(db) {
    const result = await db.collection("invoiceusers").updateMany(
      {
        $expr: {
          $eq: ["$externalId", "$_id"],
        },
        migratedExternalId: { $exists: true },
      },
      {
        $unset: { externalId: "", migratedExternalId: "" },
      },
    )
    console.log(
      `Modified ${result.modifiedCount} records of ${result.matchedCount} matched`,
      { result },
    )
  },
}
