module.exports = {
  /* eslint @typescript-eslint/ban-ts-comment: "off" */
  // @ts-ignore-next-line no-implicit-any error
  async up(db) {
    try {
      const collection = db.collection("users")
      const result = await collection.updateMany(
        { role: { $in: ["dealer", "funder", "bankowner"] } },
        { $set: { contactEnabled: false, contacts: [] } },
        { multi: true },
      )
      console.log({ result: result }, `update contactEnabled`)
    } catch (error) {
      console.log({ result: error }, `Couldn't update contactEnabled`)
    }
  },
  down() {
    return true
  },
}
