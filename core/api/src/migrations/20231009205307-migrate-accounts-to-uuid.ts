/* eslint @typescript-eslint/ban-ts-comment: "off" */
// @ts-nocheck
async function migrateAccounts(db, batchSize = 100) {
  const cursor = db.collection("accounts").find()

  let batchCount = 0
  while (await cursor.hasNext()) {
    const batchWalletUpdates = []
    const accountIpsUpdates = []
    for (let i = 0; i < batchSize && (await cursor.hasNext()); i++) {
      const account = await cursor.next()
      batchWalletUpdates.push({
        updateMany: {
          filter: { _accountId: account._id },
          update: { $set: { accountId: account.id } },
        },
      })
      accountIpsUpdates.push({
        updateMany: {
          filter: { _accountId: account._id },
          update: { $set: { accountId: account.id } },
        },
      })
    }

    batchCount += batchWalletUpdates.length

    if (batchWalletUpdates.length > 0) {
      await db.collection("wallets").bulkWrite(batchWalletUpdates)
      await db.collection("accountsips").bulkWrite(accountIpsUpdates)
      console.log(`Processed ${batchCount} accounts`)
    }
  }

  // TODO next, in a separate migration, to be able to revert easily if needed
  // await db.collection("wallets").updateMany({ $unset: { _accountId: 1 } }})
  // await db.collection("accountsIp").updateMany({ $unset: { _accountId: 1 } }})

  console.log(`Processed ${batchCount} accounts`)
}

module.exports = {
  async up(db) {
    console.log("Begin migration to Id for Wallets")
    await migrateAccounts(db)
    console.log("Migration of AccountId for wallets completed")
  },
}
