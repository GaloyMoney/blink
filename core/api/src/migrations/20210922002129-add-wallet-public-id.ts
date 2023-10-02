/* eslint @typescript-eslint/no-var-requires: "off" */
const { randomUUID } = require("crypto")

module.exports = {
  async up(db) {
    console.log("Begin to add wallet public id to users collection")
    const users = db
      .collection("users")
      .aggregate([{ $group: { _id: "$_id" } }], { cursor: { batchSize: 100 } })

    let progress = 0
    for await (const user of users) {
      progress++

      await db
        .collection("users")
        .updateOne({ _id: user._id }, { $set: { walletPublicId: randomUUID() } })

      if (progress % 1000 === 0) {
        console.log(`${progress} users updated`)
      }
    }

    console.log("Finish to add wallet public id to users collection")
  },

  async down(db) {
    await removeAttributes(db.collection("users"), ["walletPublicId"])
  },
}

const removeAttributes = (collection, attrs) => {
  const unsets = attrs.reduce((obj, key) => {
    return { ...obj, [key]: 1 }
  }, {})

  return collection.updateMany(
    {},
    {
      $unset: unsets,
    },
  )
}
