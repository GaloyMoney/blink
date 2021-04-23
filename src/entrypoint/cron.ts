import { MainBook, setupMongoConnection } from "../mongodb";
import { baseLogger, LoggedError } from "../utils";
import { updateEscrows, updateUsersPendingPayment } from "../ledger/balanceSheet"
import { SpecterWallet } from "../SpecterWallet";
import { jobSchedule } from "../schema";
import { lnd } from "../lndConfig";
import { getRoutingFees } from "../lndUtils"
import { lndAccountingPath, revenueFeePath } from "../ledger/ledger";
import _ from "lodash";

const MS_PER_DAY = 864e5

const updateRoutingFees = async () => {
  const lastDay = await jobSchedule.findOne({})

  const lastDate = new Date(lastDay?.lastDay ?? 0)

  // Done to remove effect of timezone
  lastDate.setUTCHours(0, 0, 0, 0)

  const after = lastDate.toISOString()

  const endDate = new Date(Date.now() - MS_PER_DAY);
  
  // Done to remove effect of timezone
  endDate.setUTCHours(0, 0, 0, 0)

  const before = endDate.toISOString()
  
  // Only record fee if it has been 1d+ since last record
  if((endDate.getTime() - lastDate.getTime()) / MS_PER_DAY < 1) {
    return
  }
  
  const type = "routing_fee"
  const metadata = { type, currency: "BTC", pending: false }

  // get fee collected day wise
  const forwards = await getRoutingFees({ lnd, before, after })

  // iterate over object and record fee day wise in our books
  _.forOwn(forwards, async (fee, day) => {
    try {
      await MainBook.entry("routing fee")
      .credit(revenueFeePath, fee, { ...metadata, feesCollectedOn: day})
      .debit(lndAccountingPath, fee, { ...metadata, feesCollectedOn: day })
      .commit()
    } catch(err) {
      throw new LoggedError(`${err}\n Failed to record fee:${fee} sats for day:${day}`)
    }
  })
  
  

  endDate.setDate(endDate.getDate() + 1)
  const endDay = endDate.toDateString()
  await jobSchedule.findOneAndUpdate({}, { lastDay: endDay }, { upsert: true })
}

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
} catch(err) {
  baseLogger.warn({ err }, "error in the cron job")
}
