module.exports = {
  /* eslint @typescript-eslint/ban-ts-comment: "off" */
  // @ts-ignore-next-line no-implicit-any error
  async up(db) {
    console.log("Begin up migration")

    const result = await db
      .collection("invoiceusers")
      .updateMany({}, { $set: { currency: "BTC" } })

    console.log({ result }, "migration completed")
  },
}
