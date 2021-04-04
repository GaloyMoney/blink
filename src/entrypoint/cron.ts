import { MainBook, setupMongoConnection } from "../mongodb";
import { baseLogger } from "../utils";
import { updateEscrows, updateUsersPendingPayment } from "../ledger/balanceSheet"
import { SpecterWallet } from "../SpecterWallet";
import { jobSchedule } from "../schema";
import { lnd } from "../lndConfig";
import { getRoutingFees } from "../lndUtils"
import { lndAccountingPath, revenueFeePath } from "../ledger/ledger";

const MS_PER_DAY = 864e5

const updateRoutingFees = async () => {
  const lastDay = await jobSchedule.findOne({})

  const lastDate = new Date(lastDay ? lastDay.lastDay : 0)
  lastDate.setUTCHours(0, 0, 0, 0)
  const after = lastDate.toISOString()

  const endDate = new Date(Date.now() - MS_PER_DAY);
  endDate.setUTCHours(0, 0, 0, 0)
  const endDay = endDate.toDateString()
  const before = endDate.toISOString()

  if((endDate.getTime() - lastDate.getTime()) / MS_PER_DAY < 1) {
    return
  }

  const fees = await getRoutingFees({ lnd, before, after })

  const type = "routing_fee"
  const metadata = { type, currency: "BTC", pending: false }

  await MainBook.entry("routing fee")
    .credit(revenueFeePath, fees, { ...metadata })
    .debit(lndAccountingPath, fees, { ...metadata })
    .commit()

  await jobSchedule.findOneAndUpdate({}, { lastDay: endDay }, { upsert: true })
}

const main = async () => {
  const mongoose = await setupMongoConnection()

  await updateEscrows()
  await updateUsersPendingPayment()

  const specterWallet = new SpecterWallet({ logger: baseLogger })
  await specterWallet.tentativelyRebalance()

  await mongoose.connection.close()

  // FIXME: we need to exit because we may have some pending promise
  process.exit(0)
}

try {
  main()
} catch(err) {
  baseLogger.warn({ err }, "error in the cron job")
}
