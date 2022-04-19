/**
 * how to run:
 * yarn ts-node --files -r tsconfig-paths/register src/debug/create-wallets.ts 1 f72fbdc1-505e-43d8-aece-c9ab723c6038 21000 2100 2
 * The first argument is the number of accounts to generate
 * The second argument is the walletId of the wallet that holds funds to be disbursed
 * The third argument is the amount of sats to be sent to each generated account's btc wallet
 * The fourth argument is the amount of cents to to be sent to each generated account's usd wallet
 * The fifth and final argument is the account level that will be set for each generated account
 */

import { Payments, Wallets } from "@app"
import { intraledgerPaymentSendWalletId } from "@app/wallets"
import { BTC_NETWORK } from "@config"
import { checkedToSats } from "@domain/bitcoin"
import { checkedtoCents } from "@domain/fiat"
import { checkedToAccountLevel } from "@domain/users"
import { checkedToWalletId, WalletType } from "@domain/wallets"
import { WalletCurrency } from "@domain/shared"
import { createToken } from "@services/jwt"
import { isUp } from "@services/lnd/health"
import { params as unauthParams } from "@services/lnd/unauth"
import { baseLogger } from "@services/logger"
import { setupMongoConnection } from "@services/mongodb"
import {
  AccountsRepository,
  UsersRepository,
  WalletsRepository,
} from "@services/mongoose"
import { createObjectCsvWriter } from "csv-writer"

const headers_field = ["accountId", "jwtToken", "usdWalletId", "btcWalletId", "level"]

const header = headers_field.map((item) => ({ id: item, title: item }))

const getRandomInvalidPhone = () => {
  return `+abc${Math.floor(Math.random() * 999_999_999_999_999)}`
}

type generatedWallets = {
  accountId: AccountId
  btcWalletId: WalletId
  usdWalletId: WalletId
  jwtToken: JwtToken
  level: AccountLevel
}

const generateWallets = async (count: number, level: AccountLevel) => {
  await setupMongoConnection()
  const wallets: Array<generatedWallets> = []
  for (let i = 0; i < count; i++) {
    const phone = getRandomInvalidPhone() as PhoneNumber

    const user = await UsersRepository().persistNew({ phone, phoneMetadata: undefined })
    if (user instanceof Error) return user

    const account = await AccountsRepository().findByUserId(user.id)
    if (account instanceof Error) return account

    const btcWallet = await WalletsRepository().persistNew({
      accountId: account.id,
      type: WalletType.Checking,
      currency: WalletCurrency.Btc,
    })
    if (btcWallet instanceof Error) return btcWallet

    const usdWallet = await WalletsRepository().persistNew({
      accountId: account.id,
      type: WalletType.Checking,
      currency: WalletCurrency.Usd,
    })
    if (usdWallet instanceof Error) return usdWallet

    account.defaultWalletId = usdWallet.id
    account.level = level

    const result = await AccountsRepository().update(account)
    if (result instanceof Error) return result

    const network = BTC_NETWORK

    const jwtToken = createToken({ uid: user.id, network })

    wallets.push({
      accountId: account.id,
      btcWalletId: btcWallet.id,
      usdWalletId: usdWallet.id,
      jwtToken,
      level,
    })
  }

  return wallets
}

const saveToCsv = async (wallets: Array<generatedWallets>) => {
  const csvWriter = createObjectCsvWriter({
    path: "generatedWallets.csv",
    header,
  })

  return csvWriter.writeRecords(wallets)
}

const disburseFunds = async (
  wallets: Array<generatedWallets>,
  disburserAccount: Account,
  disburserWalletId: WalletId,
  sats: Satoshis,
  cents: UsdCents,
) => {
  for (const wallet of wallets) {
    await intraledgerPaymentSendWalletId({
      recipientWalletId: wallet.btcWalletId,
      amount: sats,
      logger: baseLogger,
      senderWalletId: disburserWalletId,
      senderAccount: disburserAccount,
      memo: null,
    })

    const invoice = await Wallets.addInvoiceForRecipient({
      recipientWalletId: wallet.usdWalletId,
      amount: cents,
    })
    if (invoice instanceof Error) return invoice

    await Payments.payInvoiceByWalletId({
      paymentRequest: invoice.paymentRequest,
      memo: null,
      senderWalletId: disburserWalletId,
      senderAccount: disburserAccount,
      logger: baseLogger,
    })
  }
}

const main = async () => {
  const args = process.argv
  if (args.length === 7) {
    const numWallets = parseInt(args[2])

    const disburserWalletId = checkedToWalletId(args[3])
    if (disburserWalletId instanceof Error) return disburserWalletId

    const disburserWallet = await WalletsRepository().findById(disburserWalletId)
    if (disburserWallet instanceof Error) throw disburserWallet

    const disburserAccount = await AccountsRepository().findById(
      disburserWallet.accountId,
    )
    if (disburserAccount instanceof Error) throw disburserAccount

    const disbursementAmountSats = checkedToSats(parseInt(args[4]))
    if (disbursementAmountSats instanceof Error) return disbursementAmountSats

    const disbursementAmountCents = checkedtoCents(parseInt(args[5]))
    if (disbursementAmountCents instanceof Error) return disbursementAmountCents

    const accountLevel = checkedToAccountLevel(parseInt(args[6]))
    if (accountLevel instanceof Error) return accountLevel

    const wallets = await generateWallets(numWallets, accountLevel)
    if (wallets instanceof Error) return wallets

    await disburseFunds(
      wallets,
      disburserAccount,
      disburserWalletId,
      disbursementAmountSats,
      disbursementAmountCents,
    )

    return saveToCsv(wallets)
  } else {
    console.error("Invalid number of arguments")
  }
}

setupMongoConnection()
  .then(async (mongoose) => {
    await Promise.all(unauthParams.map((lndParams) => isUp(lndParams)))
    await main()
    return mongoose.connection.close()
  })
  .catch((err) => console.log(err))
