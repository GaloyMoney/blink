module.exports = {
  /* eslint @typescript-eslint/ban-ts-comment: "off" */
  // @ts-ignore-next-line no-implicit-any error
  async up(db) {
    try {
      const result = await db
        .collection("invoiceusers")
        .updateMany(
          { processingCompleted: { $exists: false } },
          { $set: { processingCompleted: true } },
        )
      console.log({ result }, "adding processingCompleted to invoiceusers collection")
    } catch (error) {
      console.log({ result: error }, `Couldn't update invoiceusers collection`)
    }
  },
}
