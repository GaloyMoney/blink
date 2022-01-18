module.exports = {
  async up(db) {
    const result = await db.collection("users").dropIndex("walletId_1")
    console.log({ result }, "completed walletId index drop")
  },
}
