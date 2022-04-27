module.exports = {
  async up(db) {
    const collection = db.collection("medici_transactions")
    try {
      const resultDebits = await collection.update(
        { type: "payment", debit: { $gt: 0 } },
        [{ $set: { satsAmount: { $subtract: ["$debit", "$fee"] } } }],
        { multi: true },
      )
      console.log(
        { result: resultDebits },
        "added 'satsAmount' prop to debit medici_transactions",
      )
    } catch (error) {
      console.log(
        { result: error },
        "Couldn't add 'satsAmount' prop to debit medici_transactions",
      )
    }

    try {
      const allTxns = await collection.aggregate([
        {
          $match: {
            satsAmount: { $exists: true },
          },
        },
        {
          $group: {
            _id: "$hash",
            satsAmount: { $first: "$satsAmount" },
          },
        },
      ])
      for await (const { _id: hash, satsAmount } of allTxns) {
        if (!hash) continue
        const resultRest = await collection.update({ hash }, [{ $set: { satsAmount } }], {
          multi: true,
        })
        const {
          result: { n, nModified },
        } = resultRest
        console.log(
          `added 'satsAmount' prop to ${nModified} of ${n}  transactions for hash: ${hash}`,
        )
      }
    } catch (error) {
      console.log(
        { result: error },
        "Couldn't add 'satsAmount' prop to rest of medici_transactions",
      )
    }
  },

  async down(db) {
    try {
      const result = await db
        .collection("medici_transactions")
        .update({}, { $unset: { satsAmount: "" } }, { multi: true })
      console.log({ result }, "removed 'satsAmount' prop from medici_transactions")
    } catch (error) {
      console.log(
        { result: error },
        "Couldn't remove 'satsAmount' prop from medici_transactions",
      )
    }
  },
}
