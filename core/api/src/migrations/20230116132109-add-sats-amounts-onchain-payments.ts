module.exports = {
  /* eslint @typescript-eslint/ban-ts-comment: "off" */
  // @ts-ignore-next-line no-implicit-any error
  async up(db) {
    const txTypes = ["onchain_payment"]

    const collection = db.collection("medici_transactions")

    try {
      const allTxns = await collection.aggregate([
        {
          $match: {
            type: { $in: txTypes },
            satsAmount: { $exists: false },
            currency: "BTC",
          },
        },
        {
          $group: {
            _id: "$hash",
            // For payments, 'currency: "BTC"' filter applies above:
            // - for USD: max sat debit comes from dealer BTC wallet
            // - for BTC: max sat debit comes from sender BTC wallet
            debit: { $max: "$debit" },
            fee: { $first: "$fee" },
            usd: { $first: "$usd" },
            feeUsd: { $first: "$feeUsd" },
          },
        },
      ])
      for await (const { _id: hash, debit, fee, usd, feeUsd } of allTxns) {
        if (!hash) continue
        const satsAmount = Math.round(debit - fee)
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
                satsAmountMigration: true,
              },
            },
          ],
          {
            multi: true,
          },
        )
        const { matchedCount: n, modifiedCount: nModified } = resultRest
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

  // @ts-ignore-next-line no-implicit-any error
  async down(db) {
    const txTypes = ["onchain_payment"]

    try {
      const result = await db.collection("medici_transactions").update(
        { type: { $in: txTypes }, satsAmountMigration: true },
        {
          $unset: {
            satsAmount: "",
            satsFee: "",
            centsAmount: "",
            centsFee: "",
            displayAmount: "",
            displayFee: "",
            displayCurrency: "",
            satsAmountMigration: "",
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
