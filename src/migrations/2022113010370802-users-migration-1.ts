module.exports = {
  async up(db) {
    console.log("Begin account to users property migration")
    const accounts = db.collection("accounts").find({})

    let progress = 0
    for (const account of accounts) {
      progress++

      const id = account.kratosUserId as UserId
      const phoneMetadata = account.twilio as PhoneMetadata
      const language = account.language as UserLanguage | undefined
      const deviceTokens = account.deviceToken as DeviceToken[]
      const phone = account.phone as PhoneNumber | undefined
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
