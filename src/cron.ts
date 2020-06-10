import { setupModel, setupMongoConnection } from "./db"
setupModel()

import { Price } from "./priceImpl"
import { LightningAdminWallet } from "./LightningAdminImpl"
const CronJob = require('cron').CronJob;


setupMongoConnection().then(() => {
  new CronJob(
    '* 1,11,21,31,41,51 * * * *', // run every 10 minutes
    async function() {
      try {
        const price = new Price()
        await price.update()
        
        const adminWallet = new LightningAdminWallet()
        // await adminWallet.updateUsersPendingPayment()
      } catch (err) {
        console.error(`error with cron function: ${err}`)
      }
    },
    null,
    true,
    'America/Los_Angeles'
  )  
}).catch((err) => console.log(err))
