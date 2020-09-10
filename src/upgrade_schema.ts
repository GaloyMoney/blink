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
      logger.info("all existing wallet should have BTC as currency")
      // this is to enforce the index constraint
      await User.updateMany({}, {$set: {currency: "BTC"}})
      
      logger.info("there needs to have a role: funder")
      await User.findOneAndUpdate({phone: "+1***REMOVED***", currency: "BTC"}, {role: "funder"})
  
      logger.info("earn is no longer a particular type. replace with on_us")
      await Transaction.updateMany({type: "earn"}, {$set: {type: "on_us"}})
      
      logger.info("setting db version to 1")
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
