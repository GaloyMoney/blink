import { MapDB, setupMongoConnection } from "../mongodb"
import { sleep } from "../utils"
const csv = require('csv-parser')
const fs = require('fs')
const util = require('util')  

// source ../../exportLocal.sh && ts-node ./import_and_pay.ts

export const baseLogger = require('pino')

export const insertMarkers = async (executeScript = false) => {

  let results: any[] = [];

  await fs.createReadStream('./src/tool/bitcoin beach maps - Sheet1.csv')
  .pipe(csv())
  .on('data', (data) => results.push(data))
  .on('end', async () => {
    results = results.map(item => ({
      title: item["name - es"],
      coordinate: {
        latitude: item.latitude,
        longitude: item.longitude,
      },
      username: item["***REMOVED*** username"]
    }))

    if (executeScript) {
      console.log(results)
      console.log(typeof results)
      await MapDB.insertMany(results) 
    } else {
      const script = `run db.getCollection('maps').insertMany(${util.inspect(results, {showHidden: false, depth: 3})})`
      console.log(script)
    }
  });

  await sleep(1000)

}

// only execute if it is the main module
if (require.main === module) {
  setupMongoConnection().then(() => insertMarkers()).catch((err) => baseLogger.error(err))
}



    // for (const id in results) {
    //   results[id] = {...results[id], id}
    // }
