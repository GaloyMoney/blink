import { Cron } from "./CronClass";
import { setupMongoConnection } from "./mongodb";
import { baseLogger } from "./utils";

const main = async () => {
	const cron = new Cron()
	await cron.updateEscrows()
  await cron.updateUsersPendingPayment()
  await cron.payCashBack()
  // FIXME: we probably needs to exit because we have a memleak of pending promise
	process.exit(0)
}

setupMongoConnection().then(main).catch((err) => baseLogger.error(err))