module.exports = {
  /* eslint @typescript-eslint/ban-ts-comment: "off" */
  // @ts-ignore-next-line no-implicit-any error
  async up(db) {
    console.log("Begin account to users property migration")
    const accounts = db.collection("accounts").find({})

    let progress = 0
    for await (const account of accounts) {
      progress++

      const userId = account.kratosUserId
      const phoneMetadata = account.twilio
      const language = account.language
      const deviceTokens = account.deviceToken
      const phone = account.phone
      const createdAt = account.created_at

      try {
        await db.collection("users").insertOne({
          userId,
          phoneMetadata,
          language,
          deviceTokens,
          phone,
          createdAt,
        })
      } catch (error) {
        console.log("User already exists", error)
      }

      if (progress % 1000 === 0) {
        console.log(`${progress} users updated`)
      }
    }

    console.log("Finish account to users property migration")
  },
}
