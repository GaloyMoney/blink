import { setupMongoConnection } from "./mongodb";
import { baseLogger } from "./utils";
import { getDealerWallet } from "./walletFactory";

const main = async () => {
  const dealer = await getDealerWallet({ logger: baseLogger.child({module: "cron" }) })

  const liabilities = await dealer.getLocalLiabilities()
  baseLogger.debug({liabilities}, "dealer.getLocalLiabilities()")

  await dealer.updatePositionAndLeverage()
  // FIXME: we probably needs to exit because we have a memleak of pending promise
	process.exit(0)
}

setupMongoConnection().then(main).catch((err) => baseLogger.error(err))