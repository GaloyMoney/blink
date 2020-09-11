import { setupMongoConnection } from "../mongodb";
import { WalletFactory } from "../walletFactory";
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const uid = "5f1b76e7035c825d8615fb56"
const currency = "BTC"

// need to set MONGODB_ADDRESS to call the script
// ie: MONGODB_ADDRESS=localhost ts-node export_user_create_csv.ts

const main = async () => {
  await setupMongoConnection()

  const wallet = WalletFactory({uid, currency})
  const transactions = await wallet.getRawTransactions()

  console.log({transactions})

  // console.log("csvWriter")
  // const csvWriter = createCsvWriter({
  //   path: 'records.csv',
  //   header: ['Account', 'Balance']
  // });

  // Object.keys(books).forEach(async account => await csvWriter.writeRecords([account, books[account]]));
}

main().then(o => console.log(o)).catch(err => console.log(err))
console.log("end")