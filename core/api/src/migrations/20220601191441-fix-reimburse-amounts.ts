/* eslint @typescript-eslint/ban-ts-comment: "off" */
// @ts-nocheck

module.exports = {
  async up(db) {
    const collection = db.collection("medici_transactions")

    // Fetch all reimbursement txns
    let reimbursementTxnsCursor
    try {
      reimbursementTxnsCursor = collection.find({ type: "fee_reimbursement" })
    } catch (error) {
      console.log({ result: error }, "Couldn't find reimbursement txns")
    }

    const txns = []
    for await (const txn of reimbursementTxnsCursor) {
      txns.push(txn)
    }

    // Filter all hashes for reimbursement txns
    const hashesSet = new Set(txns.map((txn) => txn.hash))
    const hashes = Array.from(hashesSet.values())

    // Update txns in db
    for (const hash of hashes) {
      const btcTxn = txns.find(
        (txn) => txn.hash === hash && txn.currency === "BTC" && txn.debit === 0,
      )
      if (btcTxn === undefined) {
        console.log(`Couldn't find usable reimbursements for ${hash}`)
        continue
      }

      const update = {
        satsAmount: btcTxn.credit,
        centsAmount: Math.floor(btcTxn.usd * 100),
        displayAmount: Math.floor(btcTxn.usd * 100),

        satsFee: 0,
        centsFee: 0,
        displayFee: 0,
      }

      try {
        const result = await collection.update(
          { hash, type: "fee_reimbursement" },
          [{ $set: update }],
          { multi: true },
        )
        console.log({ result: result.result }, `edited reimbursements for ${hash}`)
      } catch (error) {
        console.log({ result: error }, `Couldn't update reimbursements for ${hash}`)
      }
    }
  },
}
