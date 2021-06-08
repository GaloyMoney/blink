import { setupMongoConnection } from "../mongodb";
import { baseLogger } from "../logger";
import { updateUsersPendingPayment } from "../ledger/balanceSheet"
import { SpecterWallet } from "../SpecterWallet";
import { offchainLnds, updateEscrows, updateRoutingFees } from "../lndUtils";
import { InvoiceUser } from "../schema";

// FIXME use lightning instead
import { deleteFailedPayments } from "ln-service"

const deleteExpiredInvoices = async () => {
  // this should be longer than the invoice validity time
  const delta = 2 // days
  
  const date = new Date();
  date.setDate(date.getDate() - delta);
  InvoiceUser.deleteMany({timestamp: {lt: date}})
}

const deleteFailedPaymentsAllLnds = async () => {
  try {
    const lnds = offchainLnds
    for (const {lnd} of lnds) {
      // FIXME
      baseLogger.warn("only run deleteFailedPayments on lnd 0.13")
      // await deleteFailedPayments({lnd})
    }
  } catch (err) {
    baseLogger.warn({err}, "error deleting failed payment")
  }
}

const main = async () => {
  const mongoose = await setupMongoConnection()
  
  await updateEscrows()
  await updateUsersPendingPayment()
  
  await deleteExpiredInvoices()
  await deleteFailedPaymentsAllLnds()

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
