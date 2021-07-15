import { setupMongoConnection } from "../mongodb"
import { baseLogger } from "../logger"
import { User } from "../schema"
import { getCurrentPrice } from "../realtimePrice"
import { UserWallet } from "../userWallet"
import { SimpleDealerWallet } from "../dealer/DealerWallet"

const main = async () => {
  const mongoose = await setupMongoConnection()

  const lastPrice = await getCurrentPrice()
  UserWallet.setCurrentPrice(lastPrice)

  const logger = baseLogger.child({ module: "cron" })
  const dealerUser = await User.findOne({ role: "dealer" })
  const dealer = new SimpleDealerWallet({ user: dealerUser, logger })

  await dealer.updatePositionAndLeverage()

  await mongoose.connection.close()

  // FIXME: we need to exit because we may have some pending promise
  process.exit(0)
}

if (require.main === module) {
  try {
    main()
  } catch (error) {
    baseLogger.warn(`Error in 'simpleDealerEntrypoint' job: ${error}`)
  }
}
