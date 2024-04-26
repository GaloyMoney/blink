/* eslint @typescript-eslint/ban-ts-comment: "off" */
// @ts-ignore-next-line no-implicit-any
async function migrateInvoices(db, batchSize = 100) {
  const invoices = db.collection("invoiceusers").aggregate(
    [
      {
        $lookup: {
          from: "wallets",
          localField: "walletId",
          foreignField: "id",
          as: "wallet",
        },
      },
      {
        $unwind: "$wallet",
      },
      {
        $addFields: {
          joinedAccountId: "$wallet.accountId",
        },
      },
      {
        $project: {
          wallet: 0,
        },
      },
    ],
    { cursor: { batchSize } },
  )

  let progress = 0
  let skipped = 0
  let count = 0
  for await (const invoice of invoices) {
    count++
    if (invoice.accountId) {
      skipped++
      continue
    }
    progress++

    await db.collection("invoiceusers").updateOne(
      {
        _id: invoice._id,
        accountId: { $exists: false },
      },
      { $set: { accountId: invoice.joinedAccountId, migratedAccountId: true } },
    )

    if (progress % 1000 === 0) {
      console.log(
        `${progress} invoices updated, ${skipped} invoices skipped of ${count} invoices`,
      )
    }
  }

  console.log(
    `${progress} invoices updated, ${skipped} invoices skipped of ${count} invoices`,
  )
}

module.exports = {
  // @ts-ignore-next-line no-implicit-any
  async up(db) {
    console.log("Started adding account id to invoices collection")
    await migrateInvoices(db)
    console.log("Finished adding account id to invoices collection")
  },

  // @ts-ignore-next-line no-implicit-any
  async down(db) {
    const result = await db.collection("invoiceusers").updateMany(
      {
        migratedAccountId: { $exists: true },
      },
      {
        $unset: { accountId: "", migratedAccountId: "" },
      },
    )
    console.log(
      `Modified ${result.modifiedCount} records of ${result.matchedCount} matched`,
      { result },
    )
  },
}
