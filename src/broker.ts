import { setupMongoConnection } from "./mongodb";
import { baseLogger } from "./utils";
import { getBrokerWallet } from "./walletFactory";

const main = async () => {
  const broker = await getBrokerWallet({ logger: baseLogger.child({module: "cron" }) })

  const balance = await broker.getExchangeBalance()
  baseLogger.debug({ balance }, "broker.getExchangeBalance")

  await broker.updatePositionAndLeverage()
  // FIXME: we probably needs to exit because we have a memleak of pending promise
	process.exit(0)
}

setupMongoConnection().then(main).catch((err) => console.log(err))