module.exports = {
  async up(db) {
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

  async down(db) {
    await db.collection("invoiceuser").updateMany({}, { $unset: { pubkey: "" } })

    const cursor = db.collection("users").find()
    while (await cursor.hasNext()) {
      const doc = await cursor.next()
      const onchain = doc.onchain
      
      if (!onchain) {
        continue
      }

      const onchain_addresses = onchain.map(({address}) => address)
      await db.collection("users").updateOne({ _id: doc._id }, { $set: { onchain_addresses } })
    }
  },
}
