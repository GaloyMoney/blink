import { User } from "../mongodb"
import { sleep } from "../utils"
import { regExUsername } from "../wallet"
const csv = require('csv-parser')
const fs = require('fs')
const util = require('util')  

// source ../../exportLocal.sh && ts-node ./import_and_pay.ts

export const baseLogger = require('pino')()

export const insertMarkers = async (executeScript = false) => {

  let results: any[] = [];

  fs.createReadStream('./src/tool/bitcoin beach maps - Sheet1.csv')
  .pipe(csv())
  .on('data', (data) => results.push(data))
  .on('end', async () => {
    results = results.map(item => ({
      title: item["name - es"],
      coordinate: {
        type: 'Point',
        coordinates: [Number(item.latitude), Number(item.longitude)],
      },
      username: item["***REMOVED*** username"]
    }))

    if (executeScript) {

      for(const result of results) {
        const user = await User.findOne({ username: regExUsername({ username: result.username }) })
        
        if (!user) {
          console.log(`the user ${result.username} does not exist`)
          continue
        }

        if (!result.coordinate || !result.title) {
          console.log(`missing input for ${result.username}`, {result})
          continue
        }

        user.coordinate = result.coordinate
        user.title = result.title
        await user.save()
      }
    } else {
      console.log(results)
    }
  });

  await sleep(1000)

}

// only execute if it is the main module
if (require.main === module) {
  const fn = async () => {
    await insertMarkers()
  }
  fn()
}



    // for (const id in results) {
    //   results[id] = {...results[id], id}
    // }
