import { getSpecterWalletConfig } from "../config"
import { updateUsersPendingPayment } from "../balance-sheet"
import {
  deleteExpiredInvoiceUser,
  deleteFailedPaymentsAllLnds,
  updateEscrows,
  updateRoutingFees,
} from "../lnd-utils"
import { baseLogger } from "../logger"
import { setupMongoConnection } from "../mongodb"
import { SpecterWallet } from "../specter-wallet"

const main = async () => {
  const mongoose = await setupMongoConnection()

  await updateEscrows()
  await updateUsersPendingPayment()

  await deleteExpiredInvoiceUser()
  await deleteFailedPaymentsAllLnds()

  const specterWalletConfig = getSpecterWalletConfig()
  const specterWallet = new SpecterWallet({
    logger: baseLogger,
    config: specterWalletConfig,
  })
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
