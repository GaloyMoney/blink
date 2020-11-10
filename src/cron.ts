import { AdminWallet } from "./AdminWallet";
import { setupMongoConnection } from "./mongodb";
import { baseLogger } from "./utils";

const main = async () => {
	const adminWallet = new AdminWallet()
	await adminWallet.updateEscrows()
  await adminWallet.updateUsersPendingPayment()
  // FIXME: we probably needs to exit because we have a memleak of pending promise
	process.exit(0)
}

setupMongoConnection().then(main).catch((err) => baseLogger.error(err))