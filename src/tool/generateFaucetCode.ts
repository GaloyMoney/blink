import { Faucet, setupMongoConnection } from "../mongodb"
import { sleep } from "../utils";
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs')

const addFaucet = async ({amount, message}) => {
  const entry = new Faucet({ amount, message, hash: crypto.randomBytes(32).toString('hex') })
  await entry.save()
  return entry
}

// source ../../exportLocal.sh && ts-node ./import_and_pay.ts
const crypto = require('crypto');

const main = async () => {
  try {
    await setupMongoConnection()
    
    const csvWriter = createCsvWriter({
      path: 'faucet.csv',
      header: [
        {id: 'hash', title: 'Hash'},
        {id: 'qrdata', title: 'QrData'},
        {id: 'amount', title: 'Amount'},
        {id: 'message', title: "Message"}
      ]
    });
  
    const records: any[] = []
  
    let i;
    for (i = 0; i < 10; i++) {
      const result = await addFaucet({ amount: 100, message: "succesfully received 100 sats!" })    
      const entry = {qrdata: `faucet:${result.hash}`, ...result._doc}
      records.push(entry)
    }

    await csvWriter.writeRecords(records)

  } catch (e) {
    console.log({e})
  }

  
  await sleep(1000)
}


main().then(o => console.log(o)).catch(err => console.log(err))
console.log("end")
