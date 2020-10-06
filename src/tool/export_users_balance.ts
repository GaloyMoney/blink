import { AdminWallet } from "../AdminWallet";
import { setupMongoConnection } from "../mongodb"
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// need to set MONGODB_ADDRESS to call the script
// ie: TLS="1" MACAROON="2" LNDIP="3" MONGODB_ADDRESS=localhost ts-node export_users_balance.ts

const main = async () => {
  await setupMongoConnection()

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

main().then(o => console.log(o)).catch(err => console.log(err))
console.log("end")