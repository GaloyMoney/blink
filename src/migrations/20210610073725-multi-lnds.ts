module.exports = {
  async up(db, client) {
    const pubkey = process.env[`LND1_PUBKEY`]

    await db.collection("invoiceuser").updateMany({}, { $set: { pubkey } })

    const cursor = db.collection("users").find()
    while (await cursor.hasNext()) {
      const doc = await cursor.next()
      const onchain_addresses = doc.onchain_addresses

      if (!onchain_addresses) {
        continue
      }

      const onchain = onchain_addresses.map((address) => ({ address, pubkey }))
      await db.collection("users").updateOne({ _id: doc._id }, { $set: { onchain } })
    }
  },

  async down(db, client) {
    // TODO write the statements to rollback your migration (if possible)
    // Example:
    // await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: false}});
  },
}
