/* eslint @typescript-eslint/no-var-requires: "off" */
// @ts-expect-error ts complain about "Cannot redeclare block-scoped variable 'crypto'"
const { randomUUID } = require("crypto")

module.exports = {
  async up(db) {
    const users = db.collection("users").aggregate([{ $group: { _id: "$_id" } }], {
      cursor: { batchSize: 100 },
    })

    let progress = 0
    for await (const user of users) {
      const usdWalletExists = await db
        .collection("wallets")
        .find({ _accountId: user._id, currency: "USD" })
        .count()

      if (!usdWalletExists) {
        const wallet = {
          _accountId: user._id,
          type: "checking",
          currency: "USD",
          id: randomUUID(),
        }
        await db.collection("wallets").insertOne(wallet)
        progress++
      }
    }
    console.log(`${progress} wallets added`)
  },
}
