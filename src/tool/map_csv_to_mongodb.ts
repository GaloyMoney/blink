import { setupMongoConnection } from "../mongodb"

const csv = require('csv-parser')
const fs = require('fs')

// source ../../exportLocal.sh && ts-node ./import_and_pay.ts

export const baseLogger = require('pino')

const insertMarkers = async () => {

  let results: any[] = [];

  fs.createReadStream('./src/tool/bitcoin beach maps - Sheet1.csv')
  .pipe(csv())
  .on('data', (data) => results.push(data))
  .on('end', async () => {
    results = results.map(item => ({
      title: item["name - en"],
      coordinate: {
        latitude: item.latitude,
        longitude: item.longitude,
      }
    }))
    // for (const id in results) {
    //   results[id] = {...results[id], id}
    // }

    const util = require('util')
    const data = util.inspect(results, {showHidden: false, depth: 3})

    
    const script = `run db.getCollection('maps').insertMany(${data})`
    
  });
}

// only execute if it is the main module
if (require.main === module) {
  setupMongoConnection().then(insertMarkers).catch((err) => baseLogger.error(err))
}
