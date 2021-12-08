module.exports = {
  async up(db) {
    {
      const result = await db
        .collection("medici_transactions")
        .updateMany({ account_path: "Liabilities" }, [
          {
            $set: {
              account_path_org2: "$account_path",
              accounts_org2: "$accounts",
            },
          },
        ])

      console.log({ result }, "backup the field in case a roll out is needed")
    }

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

    // TODO: remove any pending invoices
    // maybe reduce invoice time to 1h and then 1 min ahead of migration?

    const users = await db.collection("users").find({})
    users

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
