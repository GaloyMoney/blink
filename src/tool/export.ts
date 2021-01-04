import { AdminWallet } from "../AdminWallet";
import {User, setupMongoConnection} from "../mongodb"
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// need to set MONGODB_ADDRESS to call the script
// ie: MONGODB_ADDRESS=localhost ts-node export_user_create_csv.ts

const main = async () => {
  await setupMongoConnection()
  await exportUsers()
  await exportBalances()
  await exportAllUserLedger()
}

const exportUsers = async () => {
  let users

  try {
    users = await User.find({"phone": {"$exists": 1}})
  } catch (err) {
    console.log(err)
  }

  console.log("csvWriter")
  const csvWriter = createCsvWriter({
    path: 'records_accounts.csv',
    header: [
        {id: 'phone', title: 'Phone'},
        {id: 'username', title: 'Username'},
        {id: 'title', title: 'Title'},
    ]
  });

  const records: any[] = []

  for (const user of users) {
    records.push({
      phone: user.phone,
      username: user.username,
      title: user.title
    })
  }

  console.log(records)
  await csvWriter.writeRecords(records)
}

const exportBalances = async () => {
  const adminWallet = new AdminWallet()
  const books = await adminWallet.getBooks()

  console.log("csvWriter")
  const csvWriter = createCsvWriter({
    path: 'users_balance.csv',
    header: [
      {id: 'account', title: 'Account'},
      {id: 'balance', title: 'Balance'},
    ]
  });

  console.log({books})
  const records: any[] = []

  for (const account in books) {
    records.push({
      account: account,
      balance: books[account]
    })
  }
  await csvWriter.writeRecords(records)
}

const exportAllUserLedger = async () => {
  const adminWAllet = new AdminWallet()
  await adminWAllet.exportAllUserLedger()
}

main().then(o => console.log(o)).catch(err => console.log(err))
console.log("end")