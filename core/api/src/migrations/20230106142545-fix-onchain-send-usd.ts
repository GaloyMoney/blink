module.exports = {
  /* eslint @typescript-eslint/ban-ts-comment: "off" */
  // @ts-ignore-next-line no-implicit-any error
  async up(db) {
    const collection = db.collection("medici_transactions")
    const newUsd = {
      $round: [
        {
          $divide: [{ $add: ["$centsAmount", "$centsFee"] }, 100],
        },
        2,
      ],
    }

    try {
      const result = await collection.update(
        {
          type: "onchain_payment",
          centsAmount: { $exists: true },
          centsFee: { $exists: true },
        },
        [{ $set: { usd: newUsd } }],
        { multi: true },
      )
      console.log({ result }, "update 'usd' property")
    } catch (error) {
      console.log({ result: error }, "Couldn't update 'usd' property")
    }
  },
}
