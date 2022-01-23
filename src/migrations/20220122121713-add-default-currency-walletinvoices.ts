module.exports = {
  async up(db) {
    console.log("Begin up migration")

    db.collection("invoiceusers").renameCollection("walletinvoices")

    const result = await db
      .collection("walletinvoices")
      .updateMany({}, { $set: { currency: "BTC" } })

    console.log({ result }, "migration completed")
  },
}
