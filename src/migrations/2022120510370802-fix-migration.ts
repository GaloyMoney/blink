module.exports = {
  async up(db) {
    const removed = await db.collection("users").deleteMany({ phone: { $exists: false } })
    console.log({ removed }, "removed users")

    const updated = await db
      .collection("users")
      .updateMany(
        { id: { $exists: true }, userId: { $exists: false } },
        { $rename: { id: "userId" } },
      )
    console.log({ updated }, "updated users")
  },
}
