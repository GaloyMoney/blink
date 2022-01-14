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
        accountId: String(user._id),
        type: "checkingbtc",
        onchain: user.onchain,
      }

      await db.collection("wallets").insertOne(wallet)

      if (progress % 1000 === 0) {
        console.log(`${progress} users updated`)
      }
    }

    console.log("completed creation of the wallets collection")

    db.collection("users").dropIndex("walletId_1")

    console.log("index dropped for users/walletId_1")

    {
      const result = await db.collection("users").updateMany(
        {},
        {
          $unset: {
            onchain: "",
            walletId: "",
          },
        },
      )

      console.log({ result }, "removing onchain and walletId field from users")
    }
  },
}
