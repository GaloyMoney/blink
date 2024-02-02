/* eslint @typescript-eslint/ban-ts-comment: "off" */
// @ts-nocheck

async function migrateAccounts(db, batchSize = 100) {
  db.collection("accounts")
    .updateMany(
      {},
      {
        $unset: { title: "", coordinates: "" },
      },
    )
    .then((result) => {
      console.log(`Processed ${result.modifiedCount} accounts`)
    })
    .catch((err) => {
      console.error("Error updating documents: ", err)
    })
}

module.exports = {
  async up(db) {
    console.log("Begin migration removal of title/location")
    await migrateAccounts(db)
    console.log("Migration completed removal of title/location")
  },
}
