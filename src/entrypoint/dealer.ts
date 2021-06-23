import { setupMongoConnection } from "../mongodb"
import { baseLogger } from "../logger"
import { getDealerWallet } from "../walletFactory"

const main = async () => {
  const mongoose = await setupMongoConnection()

  const dealer = await getDealerWallet({ logger: baseLogger.child({ module: "cron" }) })

  const liabilities = await dealer.getLocalLiabilities()
  baseLogger.debug({ liabilities }, "dealer.getLocalLiabilities()")

  await dealer.updatePositionAndLeverage()

  await mongoose.connection.close()
  // FIXME: we need to exit because we may have some pending promise
  process.exit(0)
}

if (require.main === module) {
  try {
    main()
  } catch (err) {
    baseLogger.warn({ err }, "error in the dealer job")
  }
}
