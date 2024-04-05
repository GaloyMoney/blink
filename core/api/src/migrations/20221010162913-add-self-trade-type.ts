/* eslint @typescript-eslint/ban-ts-comment: "off" */
// @ts-nocheck

/* eslint @typescript-eslint/no-var-requires: "off" */
const { Types } = require("mongoose")

const LedgerTransactionType = {
  IntraLedger: "on_us",
  LnIntraLedger: "ln_on_us",
  OnchainIntraLedger: "onchain_on_us",
  WalletIdTradeIntraAccount: "self_trade",
  LnTradeIntraAccount: "ln_self_trade",
  OnChainTradeIntraAccount: "onchain_self_trade",
}

const toWalletId = (walletIdPath) => {
  const path = walletIdPath.split(":")
  return Array.isArray(path) && path.length === 2 && path[0] === "Liabilities" && path[1]
    ? path[1]
    : undefined
}

const getNonUserWalletIds = async ({ usersCollection, walletsCollection }) => {
  const accountIds = []
  const usersCursor = usersCollection.find({
    role: { $in: ["funder", "dealer", "bankowner"] },
  })
  for await (const user of usersCursor) {
    const accountId = user._id.toString()
    accountIds.push(accountId)
  }
  const accountObjectIds = accountIds.map((id) => new Types.ObjectId(id))

  const nonUserWalletIds = []
  const walletsCursor = walletsCollection.find({
    _accountId: { $in: accountObjectIds },
  })
  for await (const wallet of walletsCursor) {
    nonUserWalletIds.push(wallet.id)
  }
  return nonUserWalletIds
}

module.exports = {
  /* eslint @typescript-eslint/ban-ts-comment: "off" */
  // @ts-ignore-next-line no-implicit-any error
  async up(db) {
    const usersCollection = db.collection("users")
    const walletsCollection = db.collection("wallets")
    const txnsCollection = db.collection("medici_transactions")

    const nonUserWalletIds = await getNonUserWalletIds({
      usersCollection,
      walletsCollection,
    })

    const accountIdsByWalletId = {}
    const getSelfTradeType = async (txnAgg) => {
      // BUILD 'txns' FOR JOURNALID
      // =====
      const txns = []
      const txnsCursor = txnsCollection.find({ _journal: txnAgg._id })
      for await (const txn of txnsCursor) {
        // Filter internal wallet IDs
        if (nonUserWalletIds.includes(toWalletId(txn.accounts))) continue

        // Filter non-user walletIds
        const walletId = toWalletId(txn.accounts)
        if (!walletId) continue

        // Fetch accountId locally
        let accountId = accountIdsByWalletId[walletId]
        if (accountId) {
          txns.push({ walletId, currency: txn.currency, accountId })
          continue
        }

        // Fetch accountId from db if not cached
        const wallet = await walletsCollection.findOne({ id: walletId })
        if (!wallet) continue
        accountId = wallet._accountId.toString()
        if (!accountId) continue

        accountIdsByWalletId[walletId] = accountId
        txns.push({ walletId, currency: txn.currency, accountId })
      }

      // CHECK 'txns' TO DETERMINE IF SELF-TRADE
      // =====

      // Check that we have txns with valid walletIds
      if (txns && txns.length === 0) return false

      // Check if we have exactly 2 txns
      if (txns.length !== 2) return false

      // Check if txns have different currencies
      if (txns[0].currency === txns[1].currency) return false

      // Compare accountIds to see if self-trade
      const accountIdsSet = new Set(txns.map((txn) => txn.accountId))
      if (accountIdsSet.size > 1) return false

      // RETURN SELF-TRADE TYPE
      // =====
      switch (txnAgg.type) {
        case LedgerTransactionType.IntraLedger:
          return LedgerTransactionType.WalletIdTradeIntraAccount
        case LedgerTransactionType.LnIntraLedger:
          return LedgerTransactionType.LnTradeIntraAccount
        case LedgerTransactionType.OnchainIntraLedger:
          return LedgerTransactionType.OnChainTradeIntraAccount
        default:
          return false
      }
    }

    // FETCH INTRALEDGER TXNS AND UPDATE TYPE FOR SELF-TRADES
    // =====
    const journalCursor = txnsCollection.aggregate([
      {
        $match: { type: { $regex: "on_us" }, currency: "USD" },
      },
      {
        $group: {
          _id: "$_journal",
          createdAt: { $first: "$timestamp" },
          type: { $first: "$type" },
        },
      },
      { $sort: { createdAt: -1 } },
    ])
    for await (const txn of journalCursor) {
      const { _id: _journal, type } = txn
      const selfTradeType = await getSelfTradeType(txn)
      if (!selfTradeType) continue

      const result = await txnsCollection.updateMany(
        { _journal },
        [
          {
            $set: {
              type: selfTradeType,
              type_old: "$type",
            },
          },
        ],
        {
          multi: true,
        },
      )
      const { modifiedCount, matchedCount } = result
      console.log(
        `changed txn type from ${type} to ${selfTradeType} for ${modifiedCount} of ${matchedCount} transactions for journalId: ${_journal.toString()}`,
      )
    }
  },

  async down(db) {
    try {
      const result = await db.collection("medici_transactions").updateMany(
        {
          type: {
            $in: [
              LedgerTransactionType.WalletIdTradeIntraAccount,
              LedgerTransactionType.LnTradeIntraAccount,
              LedgerTransactionType.OnChainTradeIntraAccount,
            ],
          },
          type_old: { $exists: true },
        },
        [
          {
            $set: {
              type: "$type_old",
            },
          },
          {
            $unset: "type_old",
          },
        ],
      )
      console.log({ result }, "revert '..self_trade' types back to '..on_us'")
    } catch (error) {
      console.log({ result: error }, "Couldn't revert '..self_trade' medici_transactions")
    }
  },
}
