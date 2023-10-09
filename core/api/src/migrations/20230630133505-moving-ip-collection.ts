/* eslint @typescript-eslint/ban-ts-comment: "off" */
// @ts-ignore-next-line no-implicit-any error
async function* getAccounts(db) {
  const cursor = db.collection("accounts").find()

  while (await cursor.hasNext()) {
    const account = await cursor.next()
    yield account
  }
}

module.exports = {
  // @ts-ignore-next-line no-implicit-any error
  async up(db) {
    console.log("Begin AccountSchema to AccountIpsSchema migration")

    let count = 0

    for await (const account of getAccounts(db)) {
      const accountId = account._id // assuming this is the ID of the account

      count += 1
      if (count % 1000 === 0) {
        console.log(`Migrated ${count} accounts`)
      }

      // Check if lastIPs exist and if it is an array
      if (Array.isArray(account.lastIPs)) {
        for (const lastIp of account.lastIPs) {
          // Construct the new document
          const accountIp = {
            ip: lastIp.ip,
            metadata: {
              provider: lastIp.provider,
              country: lastIp.country,
              isoCode: lastIp.isoCode,
              region: lastIp.region,
              city: lastIp.city,
              Type: lastIp.Type,
              asn: lastIp.asn,
              proxy: lastIp.proxy,
            },
            firstConnection: lastIp.firstConnection,
            lastConnection: lastIp.lastConnection,
            _accountId: accountId,
          }

          // Insert the new document into the AccountIps collection
          await db.collection("accountips").insertOne(accountIp)
        }
      }

      // Remove the lastIPs field from the accounts collection
      await db
        .collection("accounts")
        .updateOne({ _id: accountId }, { $unset: { lastIPs: 1, lastConnection: 1 } })
    }

    // another pass in case lastIPs and lastConnection has been added during the migration
    await db
      .collection("accounts")
      .updateMany({}, { $unset: { lastIPs: 1, lastConnection: 1 } })

    console.log("Completed AccountSchema to AccountIpsSchema migration")
  },

  async down() {
    console.log(`Rollback of AccountSchema to AccountIpsSchema migration not needed`)
  },
}
