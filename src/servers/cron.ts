import { getSpecterWalletConfig } from "@config/app"

import {
  deleteExpiredInvoiceUser,
  deleteFailedPaymentsAllLnds,
  updateEscrows,
  updateRoutingFees,
} from "@services/lnd/utils"
import { baseLogger } from "@services/logger"
import { setupMongoConnection } from "@services/mongodb"

import {
  updatePendingLightningTransactions,
  updateUsersPendingPayment,
} from "@core/balance-sheet"
import { SpecterWallet } from "@core/specter-wallet"

const main = async () => {
  const mongoose = await setupMongoConnection()

  await updateEscrows()
  await updatePendingLightningTransactions()

  await deleteExpiredInvoiceUser()
  await deleteFailedPaymentsAllLnds()

  const specterWalletConfig = getSpecterWalletConfig()
  const specterWallet = new SpecterWallet({
    logger: baseLogger,
    config: specterWalletConfig,
  })
  await specterWallet.tentativelyRebalance()

  await updateRoutingFees()

  await updateUsersPendingPayment({ onchainOnly: true })

  await mongoose.connection.close()

  // FIXME: we need to exit because we may have some pending promise
  process.exit(0)
}

try {
  main()
} catch (err) {
  baseLogger.warn({ err }, "error in the cron job")
}
