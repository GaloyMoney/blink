module.exports = {
  async up(db) {
    console.log("Begin account to users property migration")
    const accounts = db.collection("accounts").find({})

    let progress = 0
    for await (const account of accounts) {
      progress++

      const id = account.kratosUserId
      const phoneMetadata = account.twilio
      const language = account.language
      const deviceTokens = account.deviceToken
      const phone = account.phone
      const createdAt = account.created_at

      await db.collection("users").insertOne({
        id,
        phoneMetadata,
        language,
        deviceTokens,
        phone,
        createdAt,
      })

      if (progress % 1000 === 0) {
        console.log(`${progress} users updated`)
      }
    }

    console.log("Finish account to users property migration")
  },
}
