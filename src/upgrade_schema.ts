import { exit } from "process"
import { Transaction, User, DbVersion } from "./mongodb"
import { logger } from "./utils"

export const upgrade = async () => {
  
  try {
    let dbVersion = await DbVersion.findOne({})

    console.log({dbVersion})

    if (!dbVersion) {
      dbVersion = {version: 0}
    }
  
    logger.info({dbVersion}, "entering upgrade db module version")
  
    if (dbVersion.version === 0) {
      // all existing wallet should have "BTC" as currency
      await User.updateMany({}, {$set: {currency: "BTC"}})
      
      // there needs to have a role: funder now
      await User.findOneAndUpdate({phone: "+1***REMOVED***"}, {role: "funder"})
  
      // earn is no longer a particular type. replace with on_us
      await Transaction.updateMany({type: "earn"}, {$set: {type: "on_us"}})
  
      await DbVersion.findOneAndUpdate({}, {version: 1}, {upsert: true})
      logger.info("upgrade succesful to version 1")

    } else {
      logger.info("no need to upgrade the db")
    }
  } catch (err) {
    logger.error({err}, "db upgrade error. exiting")
    exit()
  }
}
