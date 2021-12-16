import { createObjectCsvWriter } from "csv-writer"
import * as _ from "lodash"

import { CSVAccountExport } from "@core/csv-account-export"

import { ledger, setupMongoConnectionSecondary } from "@services/mongodb"
import { Transaction, User } from "@services/mongoose/schema"

// need to set MONGODB_ADDRESS to call the script
// export MONGODB_PASSWORD=$(kubectl get secret -n mainnet galoy-mongodb -o=go-template='{{index .data "mongodb-password" | base64decode}}')
// ie: MONGODB_ADDRESS=localhost ts-node src/debug/export-accounts-to-csv.ts

const main = async () => {
  await setupMongoConnectionSecondary()
  await exportUsers()
  await exportBalances()
  await exportAllUserLedger()
}

const getBooks = async () => {
  const accounts = await ledger.getAllAccounts()

  // used for debugging
  const books = {}
  for (const account of accounts) {
    for (const currency of ["USD", "BTC"]) {
      const balance = await ledger.getAccountBalance(account, { currency })
      if (balance) {
        books[`${currency}:${account}`] = balance
      }
    }
  }

  // console.log(books, "status of our bookeeping")
  return books
}

const exportAllUserLedger = async () => {
  const csv = new CSVAccountExport()

  for await (const user of User.find({})) {
    await csv.addAccount({ account: ledger.accountPath(user._id) })
  }

  await csv.saveToDisk()
}

const exportUsers = async () => {
  let users

  try {
    users = await User.find({ phone: { $exists: 1 } })
  } catch (err) {
    console.log(err)
  }

  console.log("csvWriter")
  const csvWriter = createObjectCsvWriter({
    path: "records_accounts.csv",
    header: [
      { id: "uid", title: "uid" },
      { id: "phone", title: "Phone" },
      { id: "username", title: "Username" },
      { id: "title", title: "Title" },
      { id: "balanceUSD", title: "balanceUSD" },
      { id: "balanceBTC", title: "balanceBTC" },
      { id: "carrier_name", title: "carrier_name" },
      { id: "carrier_type", title: "carrier_type" },
      { id: "created_at", title: "created_at" },
      { id: "totalCredit", title: "totalCredit" },
      { id: "totalDebit", title: "totalDebit" },
      { id: "countTxs", title: "countTxs" },
    ],
  })

  const records: Record<string, Primitive>[] = []

  // TODO filter with USD / BTC currency
  const aggregateTxs = await Transaction.aggregate([
    {
      $group: {
        _id: "$accounts",
        totalDebit: { $sum: "$debit" },
        totalCredit: { $sum: "$credit" },
        countTxs: { $sum: 1 },
      },
    },
  ])

  for (const user of users) {
    console.log(`processing ${user._id}`)

    const record = {
      uid: user._id,
      phone: user.phone,
      username: user.username,
      title: user.title,
      created_at: user.created_at,
      carrier_name: user.twilio?.carrier?.name,
      carrier_type: user.twilio?.carrier?.type,
    }

    for (const currency of ["USD", "BTC"]) {
      record[`balance${currency}`] = await ledger.getAccountBalance(user.accountPath, {
        currency,
      })
    }

    try {
      const { totalDebit, totalCredit, countTxs } = _.find(aggregateTxs, {
        _id: user.accountPath,
      })
      record["totalDebit"] = totalDebit
      record["totalCredit"] = totalCredit
      record["countTxs"] = countTxs
    } catch (err) {
      console.log({ err })
    }

    records.push(record)
  }

  console.log(records)
  await csvWriter.writeRecords(records)
}

const exportBalances = async () => {
  const books = await getBooks()

  console.log("csvWriter")
  const csvWriter = createObjectCsvWriter({
    path: "users_balance.csv",
    header: [
      { id: "account", title: "Account" },
      { id: "balance", title: "Balance" },
    ],
  })

  console.log({ books })
  const records: Record<string, Primitive>[] = []

  for (const account in books) {
    records.push({
      account: account,
      balance: books[account],
    })
  }
  await csvWriter.writeRecords(records)
}

main()
  .then((o) => console.log(o))
  .catch((err) => console.log(err))
console.log("end")
