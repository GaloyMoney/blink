/* eslint @typescript-eslint/no-var-requires: "off" */
// @ts-expect-error ts complain about "Cannot redeclare block-scoped variable 'crypto'"
const crypto = require("crypto")

const adminUsers = [
  {
    role: "dealer",
    needUsdWallet: true,
    phone: "+1928282918",
  },
  { role: "funder" },
  { role: "bankowner" },
]

const getRandomInvalidPhone = () => {
  return `+abc${Math.floor(Math.random() * 999_999_999_999_999)}`
}

const defaultWallet = { __v: 0, type: "checking", onchain: [] }

module.exports = {
  async up(db /*, client */) {
    for (const userMeta of adminUsers) {
      const role = userMeta.role
      let user = await db.collection("users").findOne({ role })

      let userId
      if (!user) {
        const phone = userMeta.phone ?? getRandomInvalidPhone()
        const created_at = new Date()
        const result = await db.collection("users").insertOne({ role, phone, created_at })
        userId = result.insertedId

        user = await db.collection("users").findOne({ role })
      } else {
        console.log({ role }, "user exist")
        userId = user._id
      }

      const _accountId = userId
      // const accountId = Types.ObjectId(userId)
      let wallet = await db.collection("wallets").findOne({ _accountId, currency: "BTC" })

      if (!wallet) {
        const currency = "BTC"
        const id = crypto.randomUUID()

        const result = await db
          .collection("wallets")
          .insertOne({ _accountId, currency, id, ...defaultWallet })

        wallet = await db.collection("wallets").findOne({ _accountId, currency: "BTC" })

        console.log({ result, currency }, "wallet has been created")
      } else {
        console.log({ role, walletExist: wallet }, "wallet exist")
      }

      if (user.defaultWalletId === undefined) {
        const result = await db
          .collection("users")
          .findOneAndUpdate({ role }, { $set: { defaultWalletId: wallet.id } })

        console.log({ result, role }, "update defaultWalletId")
      } else {
        console.log({ role }, "no need to update defaultWalletId")
      }

      if (userMeta.needUsdWallet) {
        const currency = "USD"
        wallet = await db.collection("wallets").findOne({ _accountId, currency })

        if (!wallet) {
          const id = crypto.randomUUID()
          const result = await db
            .collection("wallets")
            .insertOne({ _accountId, currency, id, ...defaultWallet })

          wallet = await db.collection("wallets").findOne({ _accountId, currency: "BTC" })

          console.log({ result, currency }, "wallet has been created")
        } else {
          console.log({ role, walletExist: wallet, currency }, "wallet exist")
        }
      }
    }
  },
}
