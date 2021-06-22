import { setupMongoConnection } from "../mongodb"
import { baseLogger } from "../logger"
import { updateEscrows, updateUsersPendingPayment } from "../ledger/balanceSheet"
import { SpecterWallet } from "../SpecterWallet"
import { updateRoutingFees } from "../lndUtils"

const main = async () => {
  const mongoose = await setupMongoConnection()

  await updateEscrows()
  await updateUsersPendingPayment()

  const specterWallet = new SpecterWallet({ logger: baseLogger })
  await specterWallet.tentativelyRebalance()

  await updateRoutingFees()

  await mongoose.connection.close()

  // FIXME: we need to exit because we may have some pending promise
  process.exit(0)
}

try {
  main()
} catch (err) {
  baseLogger.warn({ err }, "error in the cron job")
}
