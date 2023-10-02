module.exports = {
  async up(db) {
    {
      const result = await db.collection("users").updateMany({}, [
        {
          $set: {
            defaultWalletId: "$walletId",
          },
        },
      ])

      console.log({ result }, "completed walletIds and defaultWalletId field creation")
    }

    const users = db.collection("users").find(
      {},
      {
        _id: 1,
        defaultWalletId: 1,
        onchain: 1,
      },
    )

    let progress = 0
    for await (const user of users) {
      progress++

      const wallet = {
        id: user.defaultWalletId,
        _accountId: user._id,
        type: "checking",
        currency: "BTC",
        onchain: user.onchain,
      }

      await db.collection("wallets").insertOne(wallet)

      if (progress % 1000 === 0) {
        console.log(`${progress} users updated`)
      }
    }
  },
}
