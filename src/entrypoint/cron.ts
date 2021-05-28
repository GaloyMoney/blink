import { setupMongoConnection } from "../mongodb";
import { baseLogger } from "../logger";
import { updateUsersPendingPayment } from "../ledger/balanceSheet"
import { SpecterWallet } from "../SpecterWallet";
import { getAllOffchainLnd, updateEscrows, updateRoutingFees } from "../lndUtils";
import { InvoiceUser } from "../schema";

// FIXME use lightning instead
import { deleteFailedPayments } from "ln-service"

const deleteExpiredInvoices = async () => {
  const delta = 7 // days
  const date = new Date();
  date.setDate(date.getDate() - delta);
  InvoiceUser.deleteMany({timestamp: {lt: date}})
}

const main = async () => {
  const mongoose = await setupMongoConnection()
  
  await updateEscrows()
  await updateUsersPendingPayment()
  
  await deleteExpiredInvoices()

  try {
    const lnds = getAllOffchainLnd
    for (const {lnd} of lnds) {
      await deleteFailedPayments({lnd})
    }
  } catch (err) {
    baseLogger.warn({err}, "error deleting failed payment")
  }

  const specterWallet = new SpecterWallet({ logger: baseLogger })
  await specterWallet.tentativelyRebalance()
  
  await updateRoutingFees()

  await mongoose.connection.close()

  // FIXME: we need to exit because we may have some pending promise
  process.exit(0)
}

try {
  main()
} catch(err) {
  baseLogger.warn({ err }, "error in the cron job")
}
