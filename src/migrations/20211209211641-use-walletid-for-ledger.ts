module.exports = {
  async up(db) {
    {
      const result = await db.collection("users").updateMany({}, [
        {
          $set: {
            walletId: "$walletPublicId",
          },
        },
      ])

      console.log(
        { result },
        "creating walletId for user (duplication of walletPublicId)",
      )
    }
  },
}
