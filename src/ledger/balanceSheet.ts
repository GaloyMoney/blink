import { getChannels } from "lightning"
import * as _ from "lodash"
import { lnd } from "../lndConfig"
import { lndBalances } from "../lndUtils"
import { MainBook } from "../mongodb"
import { User } from "../schema"
import { baseLogger } from "../logger"
import { WalletFactory } from "../walletFactory"
import {
  bitcoindAccountingPath,
  escrowAccountingPath,
  lndAccountingPath,
  lndFeePath,
} from "./ledger"
import { getBalance as getBitcoindBalance } from "../bitcoind"

const logger = baseLogger.child({ module: "balanceSheet" })

export const updateUsersPendingPayment = async () => {
  let userWallet

  for await (const user of User.find({})) {
    logger.trace("updating user %o", user._id)

    // A better approach would be to just loop over pending: true invoice/payment
    userWallet = await WalletFactory({ user, logger })
    await userWallet.updatePending()
  }
}

export const getBalanceSheet = async () => {
  const { balance: assets } = await MainBook.balance({
    account_path: "Assets",
    currency: "BTC",
  })
  const { balance: liabilities } = await MainBook.balance({
    account_path: "Liabilities",
    currency: "BTC",
  })
  const { balance: lightning } = await MainBook.balance({
    accounts: lndAccountingPath,
    currency: "BTC",
  })
  const { balance: bitcoin } = await MainBook.balance({
    accounts: bitcoindAccountingPath,
    currency: "BTC",
  })
  const { balance: expenses } = await MainBook.balance({
    accounts: lndFeePath,
    currency: "BTC",
  })
  const { balance: revenue } = await MainBook.balance({
    account_path: "Revenue",
    currency: "BTC",
  })

  return { assets, liabilities, lightning, expenses, bitcoin, revenue }
}

export const balanceSheetIsBalanced = async () => {
  const { assets, liabilities, lightning, bitcoin, expenses, revenue } =
    await getBalanceSheet()
  const { total: lnd } = await lndBalances() // doesnt include escrow amount

  const bitcoind = await getBitcoindBalance()

  const assetsLiabilitiesDifference =
    assets /* assets is ___ */ +
    liabilities /* liabilities is ___ */ +
    expenses /* expense is positif */ +
    revenue /* revenue is ___ */

  const bookingVersusRealWorldAssets =
    lnd +
    bitcoind + // physical assets or value of account at third party
    (lightning + bitcoin) // value in accounting

  if (!!bookingVersusRealWorldAssets || !!assetsLiabilitiesDifference) {
    logger.debug(
      {
        assetsLiabilitiesDifference,
        bookingVersusRealWorldAssets,
        assets,
        liabilities,
        expenses,
        revenue,
        lnd,
        lightning,
        bitcoind,
        bitcoin,
      },
      `not balanced`,
    )
  }

  return { assetsLiabilitiesDifference, bookingVersusRealWorldAssets }
}

export const updateEscrows = async () => {
  const type = "escrow"
  const metadata = { type, currency: "BTC", pending: false }

  const { channels } = await getChannels({ lnd })
  const selfInitatedChannels = _.filter(channels, { is_partner_initiated: false })
  const escrowInLnd = _.sumBy(selfInitatedChannels, "commit_transaction_fee")

  const { balance: escrowInMongodb } = await MainBook.balance({
    account: escrowAccountingPath,
    currency: "BTC",
  })

  // escrowInMongodb is negative
  // diff will equal 0 if there is no change
  const diff = escrowInLnd + escrowInMongodb

  logger.info({ diff, escrowInLnd, escrowInMongodb, channels }, "escrow recording")

  if (diff > 0) {
    await MainBook.entry("escrow")
      .credit(lndAccountingPath, diff, { ...metadata })
      .debit(escrowAccountingPath, diff, { ...metadata })
      .commit()
  } else if (diff < 0) {
    await MainBook.entry("escrow")
      .debit(lndAccountingPath, -diff, { ...metadata })
      .credit(escrowAccountingPath, -diff, { ...metadata })
      .commit()
  }
}
