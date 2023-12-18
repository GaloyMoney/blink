module.exports = {
  /* eslint @typescript-eslint/ban-ts-comment: "off" */
  // @ts-ignore-next-line no-implicit-any error
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
