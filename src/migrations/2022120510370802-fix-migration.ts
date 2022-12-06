module.exports = {
  async up(db) {
    console.log("Begin account to users property migration")

    const users = db.collection("users").find({ id: { $exists: true } })

    let progress = 0
    for await (const user of users) {
      progress++

      const userId = user.id
      const phoneMetadata = user.phoneMetadata
      const language = user.language ?? ""
      const deviceTokens = user.deviceTokens ?? []
      const phone = user.phone
      const createdAt = user.createdAt

      await db.collection("users").updateOne(
        {
          userId,
        },
        {
          $set: {
            phoneMetadata,
            language,
            deviceTokens,
            phone,
            createdAt,
          },
        },
        { upsert: true },
      )

      if (progress % 1000 === 0) {
        console.log(`${progress} users updated`)
      }
    }

    console.log("Finish account to users property migration")
  },
}
