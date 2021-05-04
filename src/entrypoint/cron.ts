import { MainBook, setupMongoConnection } from "../mongodb";
import { baseLogger } from "../logger";
import { updateEscrows, updateUsersPendingPayment } from "../ledger/balanceSheet"
import { SpecterWallet } from "../SpecterWallet";
import { DbMetadata } from "../schema";
import { lnd } from "../lndConfig";
import { getRoutingFees } from "../lndUtils"
import { lndAccountingPath, revenueFeePath } from "../ledger/ledger";
import _ from "lodash";
import { DbError } from "../error";

const MS_PER_DAY = 864e5

const updateRoutingFees = async () => {
  const dbMetadata = await DbMetadata.findOne({})

  let lastDate

  if(dbMetadata.routingFeeLastEntry) {
    lastDate = new Date(dbMetadata.routingFeeLastEntry)
  } else {
    lastDate = new Date(0)
    baseLogger.info('Running the routing fee revenue cronjob for the first time')
  }

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
      throw new DbError('Unable to record routing revenue', {forwardToClient: false, logger: baseLogger, level: 'error'})
    }
  })
  
  endDate.setDate(endDate.getDate() + 1)
  const endDay = endDate.toDateString()
  await DbMetadata.findOneAndUpdate({}, { $set: { routingFeeLastEntry: endDay } }, { upsert: true })
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
