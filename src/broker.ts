import { setupMongoConnection } from "./mongodb";
import { baseLogger } from "./utils";
import { getBrokerWallet } from "./walletFactory";

const main = async () => {
  const broker = await getBrokerWallet({ logger: baseLogger.child({module: "cron" }) })

  const liabilities = await broker.getLocalLiabilities()
  baseLogger.debug({liabilities}, "broker.getLocalLiabilities()")

  await broker.updatePositionAndLeverage()
  // FIXME: we probably needs to exit because we have a memleak of pending promise
	process.exit(0)
}

setupMongoConnection().then(main).catch((err) => baseLogger.error(err))