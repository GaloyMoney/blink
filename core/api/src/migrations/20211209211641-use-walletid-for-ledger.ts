module.exports = {
  async up(db) {
    {
      const result = await db.collection("users").updateMany({}, [
        {
          $set: {
            walletId: "$walletPublicId",
          },
        },
      ])

      console.log(
        { result },
        "creating walletId for user (duplication of walletPublicId)",
      )
    }

    {
      const result = await db
        .collection("medici_transactions")
        .updateMany({ account_path: "Liabilities" }, [
          {
            $set: {
              account_path_old_userid: "$account_path",
              accounts_old_userid: "$accounts",
            },
          },
        ])

      console.log({ result }, "backup the field in case a roll out is needed")
    }

    // TODO: remove any pending invoices
    // maybe reduce invoice time to 1h and then 1 min ahead of migration?

    const users = db.collection("users").find(
      {},
      {
        _id: 1,
        walletId: 1,
      },
    )

    let progress = 0
    for await (const user of users) {
      progress++

      const walletId = user.walletId
      const userId = user._id

      const condition_medici_transactions = { account_path: String(userId) }
      const condition_invoiceusers = { uid: String(userId) }

      await db
        .collection("medici_transactions")
        .updateMany(condition_medici_transactions, {
          $set: {
            account_path: ["Liabilities", walletId],
            accounts: `Liabilities:${walletId}`,
          },
        })

      await db.collection("invoiceusers").updateMany(condition_invoiceusers, {
        $set: { walletId },
      })

      if (progress % 1000 === 0) {
        console.log(`${progress} users updated`)
      }
    }
  },

  async down(db) {
    await db
      .collection("medici_transactions")
      .updateMany({ account_path: "Liabilities" }, [
        {
          $set: {
            account_path: "$account_path_old_userid",
            accounts: "$accounts_old_userid",
          },
        },
      ])
  },
}
