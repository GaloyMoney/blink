module.exports = {
  async up(db) {
    try {
      const collection = db.collection("users")
      const result = await collection.updateMany(
        { role: { $ne: "user" } },
        { $set: { contactEnabled: false } },
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
