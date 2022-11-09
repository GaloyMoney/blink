module.exports = {
  async up(db) {
    try {
      await db.renameCollection("users", "accounts")
      console.log(`migration of users to accounts successful`)
    } catch (error) {
      console.log({ result: error }, `Couldn't rename user collection`)
    }
  },
  down() {
    return true
  },
}
