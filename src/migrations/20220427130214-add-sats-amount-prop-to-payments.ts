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
        "added new props to debit medici_transactions",
      )
    } catch (error) {
      console.log(
        { result: error },
        "Couldn't add new props to debit medici_transactions",
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
            fee: { $first: "$fee" },
            usd: { $first: "$usd" },
            feeUsd: { $first: "$feeUsd" },
          },
        },
      ])
      for await (const { _id: hash, satsAmount, fee, usd, feeUsd } of allTxns) {
        if (!hash) continue
        const centsAmount = Math.round((usd - feeUsd) * 100)
        const centsFee = Math.round(feeUsd * 100)

        const resultRest = await collection.update(
          { hash },
          [
            {
              $set: {
                satsAmount,
                satsFee: fee,
                centsAmount,
                centsFee,
                displayAmount: centsAmount,
                displayFee: centsFee,
                displayCurrency: "USD",
              },
            },
          ],
          {
            multi: true,
          },
        )
        const {
          result: { n, nModified },
        } = resultRest
        console.log(
          `added new props to ${nModified} of ${n}  transactions for hash: ${hash}`,
        )
      }
    } catch (error) {
      console.log(
        { result: error },
        "Couldn't add new props to rest of medici_transactions",
      )
    }
  },

  async down(db) {
    try {
      const result = await db.collection("medici_transactions").update(
        {},
        {
          $unset: {
            satsAmount: "",
            satsFee: "",
            centsAmount: "",
            centsFee: "",
            displayAmount: "",
            displayFee: "",
            displayCurrency: "",
          },
        },
        { multi: true },
      )
      console.log({ result }, "removed new props from medici_transactions")
    } catch (error) {
      console.log({ result: error }, "Couldn't remove new props from medici_transactions")
    }
  },
}
