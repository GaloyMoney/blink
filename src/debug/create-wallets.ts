/**
 * how to run:
 *
 * Make sure there's a file named reimbursements.json in src/debug
 * following the structure:
 * {
 *  "feeUpdateOperations" = [
 *    { "walletId": "first-wallet-id", fee: 13, memo: "your memo" },
 *    { "walletId": "second-wallet-id", fee: 10, memo: "refund" },
 *  ]
 * }
 * yarn ts-node --files -r tsconfig-paths/register src/debug/reimburse.ts
 */

import { Accounts, Wallets } from "@app"
import { intraledgerPaymentSendWalletId } from "@app/wallets"
import { BTC_NETWORK } from "@config"
import { checkedToSats } from "@domain/bitcoin"
import { checkedToAccountLevel } from "@domain/users"
import { checkedToWalletId, WalletCurrency, WalletType } from "@domain/wallets"
import { createToken } from "@services/jwt"
import { baseLogger } from "@services/logger"
import { setupMongoConnection } from "@services/mongodb"
import {
  AccountsRepository,
  UsersRepository,
  WalletsRepository,
} from "@services/mongoose"
import { User } from "@services/mongoose/schema"
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

    const user = await UsersRepository().persistNew({ phone, phoneMetadata: null })
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
  amount: Satoshis,
) => {
  for (const wallet of wallets) {
    await intraledgerPaymentSendWalletId({
      recipientWalletId: wallet.btcWalletId,
      amount,
      logger: baseLogger,
      senderWalletId: disburserWalletId,
      senderAccount: disburserAccount,
      memo: null,
    })

    const invoice = await Wallets.addInvoiceForRecipient({
      recipientWalletId: wallet.usdWalletId,
      amount,
    })

    if (invoice instanceof Error) return invoice

    await Wallets.payInvoiceByWalletId({
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
  if (args.length === 6) {
    const numWallets = parseInt(args[2])

    const disburserWalletId = checkedToWalletId(args[3])
    if (disburserWalletId instanceof Error) return disburserWalletId

    const disburserWallet = await WalletsRepository().findById(disburserWalletId)
    if (disburserWallet instanceof Error) throw disburserWallet

    const disburserAccount = await AccountsRepository().findById(
      disburserWallet.accountId,
    )
    if (disburserAccount instanceof Error) throw disburserAccount

    const disbursementAmount = checkedToSats(parseInt(args[4]))
    if (disbursementAmount instanceof Error) return disbursementAmount

    const accountLevel = checkedToAccountLevel(parseInt(args[5]))
    if (accountLevel instanceof Error) return accountLevel

    const wallets = await generateWallets(numWallets, accountLevel)
    if (wallets instanceof Error) return wallets

    await disburseFunds(wallets, disburserAccount, disburserWalletId, disbursementAmount)

    return saveToCsv(wallets)
  } else {
    console.error("Invalid number of arguments")
  }
}

setupMongoConnection()
  .then(async (mongoose) => {
    await main()
    return mongoose.connection.close()
  })
  .catch((err) => console.log(err))
