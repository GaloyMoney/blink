module.exports = {
  async up(db) {
    const ftxTxsCursor = await db
      .collection("medici_transactions")
      .find({ accounts: /FTX/i })

    while (ftxTxsCursor.hasNext()) {
      const ftxTx = ftxTxsCursor.next()
      const result = await db
        .collection("medici_journals")
        .deleteOne({ _id: ftxTx._journal })
      console.log({ result, ftxTx }, "delete useless accounting journal entries")
    }

    {
      const result = await db
        .collection("medici_transactions")
        .deleteMany({ accounts: /FTX/i })

      console.log({ result }, "delete useless accounting transactions entries")
    }

    {
      const result = await db
        .collection("medici_transactions")
        .updateMany({ account_path: "Liabilities" }, [
          {
            $set: {
              account_path_org: "$account_path",
              accounts_org: "$accounts",
            },
          },
        ])

      console.log({ result }, "backup the field in case a roll out is needed")
    }

    {
      const result = await db
        .collection("medici_transactions")
        .updateMany(
          { account_path: "Liabilities" },
          { $pull: { account_path: "Customer" } },
        )

      console.log({ result }, "set up the account_path array")
    }

    {
      const result = await db
        .collection("medici_transactions")
        .updateMany({ account_path: "Liabilities" }, [
          { $set: { tmp_accounts_uid: { $substrCP: ["$accounts_org", 21, 100] } } },
        ])

      console.log({ result }, "create tmp_accounts_uid field")
    }

    {
      const result = await db
        .collection("medici_transactions")
        .updateMany({ account_path: "Liabilities" }, [
          {
            $set: {
              accounts: { $concat: ["Liabilities", ":", "$tmp_accounts_uid"] },
            },
          },
        ])

      console.log({ result }, "set the new accounts field")
    }
  },

  async down(db) {
    await db
      .collection("medici_transactions")
      .updateMany({ account_path: "Liabilities" }, [
        {
          $set: {
            account_path: "$account_path_org",
            accounts: "$accounts_org",
          },
        },
      ])
  },
}
