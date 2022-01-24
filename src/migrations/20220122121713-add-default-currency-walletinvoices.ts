module.exports = {
  async up(db) {
    console.log("Begin up migration")

    const result = await db
      .collection("invoiceusers")
      .updateMany({}, { $set: { currency: "BTC" } })

    console.log({ result }, "migration completed")
  },
}
