// export MONGODB_PASSWORD=$(kubectl get secret -n testnet galoy-mongodb -o=go-template='{{index .data "mongodb-password" | base64decode}}')
// export LND1_PUBKEY=$(kubectl get secret -n testnet lnd1-pubkey --template={{.data.pubkey}} | base64 -d)

module.exports = {
  async up(db) {
    const pubkey = process.env[`LND1_PUBKEY`]

    console.log({pubkey})

    if (!pubkey) {
      throw Error("pubkey mandatory")
    }

    await db.collection("invoiceusers").updateMany({}, { $set: { pubkey } })

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

    // TODO, eventually:
    // await db.collection("invoiceuser").updateMany({}, { $unset: { onchain_addresses: "" } })
  },

  // not strictly needed even to roll back.

  async down(db) {
    await db.collection("invoiceusers").updateMany({}, { $unset: { pubkey: "" } })
    await db.collection("users").updateMany({}, { $unset: { onchain: "" } })

    // const cursor = db.collection("users").find()
    // while (await cursor.hasNext()) {
    //   const doc = await cursor.next()
    //   const onchain = doc.onchain

    //   if (!onchain) {
    //     continue
    //   }

    //   const onchain_addresses = onchain.map(({address}) => address)
    //   await db.collection("users").updateOne({ _id: doc._id }, { $set: { onchain_addresses } })
    // }
  },
}
