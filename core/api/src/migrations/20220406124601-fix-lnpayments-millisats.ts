module.exports = {
  async up(db) {
    try {
      const result = await db
        .collection("lnpayments")
        .update(
          { milliSatsAmount: { $type: 2 } },
          [{ $set: { milliSatsAmount: { $toInt: "$milliSatsAmount" } } }],
          { multi: true },
        )
      console.log({ result }, "updated lnpayments")
    } catch (error) {
      console.log({ result: error }, "Couldn't update lnpayments")
    }
  },
}
