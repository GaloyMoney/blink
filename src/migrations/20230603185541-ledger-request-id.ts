module.exports = {
  async up(db) {
    await db
      .collection("medici_transactions")
      .updateMany({}, { $rename: { new_address_request_id: "request_id" } })
  },

  async down(db) {
    await db
      .collection("medici_transactions")
      .updateMany({}, { $rename: { request_id: "new_address_request_id" } })
  },
}
