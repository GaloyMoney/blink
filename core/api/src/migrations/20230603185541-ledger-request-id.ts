module.exports = {
  /* eslint @typescript-eslint/ban-ts-comment: "off" */
  // @ts-ignore-next-line no-implicit-any error
  async up(db) {
    await db
      .collection("medici_transactions")
      .updateMany({}, { $rename: { new_address_request_id: "request_id" } })
  },

  // @ts-ignore-next-line no-implicit-any error
  async down(db) {
    await db
      .collection("medici_transactions")
      .updateMany({}, { $rename: { request_id: "new_address_request_id" } })
  },
}
