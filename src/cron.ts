import { setupMongoConnection } from "./mongodb";
import { baseLogger } from "./utils";
import { updateEscrows, updateUsersPendingPayment, payCashBack } from "./balanceSheet"
import { SpecterWallet } from "./SpecterWallet";

const main = async () => {
	await updateEscrows()
  await updateUsersPendingPayment()
  await payCashBack()

  const specterWallet =  new SpecterWallet({ logger: baseLogger })
  await specterWallet.tentativelyRebalance()

  // FIXME: we probably needs to exit because we have a memleak of pending promise
	process.exit(0)
}

setupMongoConnection().then(main).catch((err) => baseLogger.error(err))