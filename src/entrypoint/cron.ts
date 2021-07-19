import { yamlConfig } from "../config"
import { updateUsersPendingPayment } from "../ledger/balanceSheet"
import {
  deleteExpiredInvoices,
  deleteFailedPaymentsAllLnds,
  updateEscrows,
  updateRoutingFees,
} from "../lndUtils"
import { baseLogger } from "../logger"
import { setupMongoConnection } from "../mongodb"
import { SpecterWalletConfig } from "../types"
import { SpecterWallet } from "../SpecterWallet"

const specterWalletConfig: SpecterWalletConfig = {
  lndHoldingBase: yamlConfig.rebalancing.lndHoldingBase,
  ratioTargetDeposit: yamlConfig.rebalancing.ratioTargetDeposit,
  ratioTargetWithdraw: yamlConfig.rebalancing.ratioTargetWithdraw,
  minOnchain: yamlConfig.rebalancing.minOnchain,
  onchainWallet: yamlConfig.rebalancing.onchainWallet,
}

const main = async () => {
  const mongoose = await setupMongoConnection()

  await updateEscrows()
  await updateUsersPendingPayment()

  await deleteExpiredInvoices()
  await deleteFailedPaymentsAllLnds()

  const specterWallet = new SpecterWallet({ logger: baseLogger, config: specterWalletConfig })
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
