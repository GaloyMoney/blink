module.exports = {
  async up(db) {
    {
      const result = await db.collection("users").dropIndex("walletId_1")

      console.log({ result }, "index dropped for users/walletId_1")
    }

    {
      const result = await db.collection("users").updateMany(
        {},
        {
          $unset: {
            onchain: "",
            walletId: "",
            walletPublicId: "",
          },
        },
      )

      console.log({ result }, "removing onchain and walletId field from users")
    }
  },
}
