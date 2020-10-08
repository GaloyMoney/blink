import { customerPath } from "../ledger";
import { MainBook, setupMongoConnection } from "../mongodb";
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const uid = "5f5bdcc1c2cec44610ee24d2"

// need to set MONGODB_ADDRESS to call the script
// ie: MONGODB_ADDRESS=localhost ts-node export_user_create_csv.ts

const main = async () => {
  await setupMongoConnection()

  const { results: transactions } = await MainBook.ledger({
    account: customerPath(uid),
  })

  console.log("csvWriter")
  const csvWriter = createCsvWriter({
    path: `record_transactions_${uid}.csv`,
    header: [
      {id: 'voided', title: 'voided'},
      {id: 'approved', title: 'approved'},
      {id: '_id', title: '_id'},
      {id: 'accounts', title: 'accounts'},
      {id: 'credit', title: 'credit'},
      {id: 'debit', title: 'debit'},
      {id: '_journal', title: '_journal'},
      {id: 'book', title: 'book'},
      {id: 'datetime', title: 'datetime'},
      {id: 'currency', title: 'currency'},
      {id: 'type', title: 'type'},
      {id: 'hash', title: 'hash'},
      {id: 'txid', title: 'txid'},
      {id: 'meta', title: 'meta'},
    ]
  });

  transactions.forEach(tx => tx.meta = JSON.stringify(tx.meta))
  await csvWriter.writeRecords(transactions)
}

main().then(o => console.log(o)).catch(err => console.log(err))
console.log("end")