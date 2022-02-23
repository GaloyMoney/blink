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

import { Accounts } from "@app"
import { intraledgerPaymentSendWalletId } from "@app/wallets"
import { BTC_NETWORK, JWT_SECRET } from "@config"
import { checkedToSats } from "@domain/bitcoin"
import { checkedToAccountLevel } from "@domain/users"
import { checkedToWalletId, WalletCurrency, WalletType } from "@domain/wallets"
import { createToken } from "@services/jwt"
import { setupMongoConnection } from "@services/mongodb"
import { AccountsRepository, WalletsRepository } from "@services/mongoose"
import { User } from "@services/mongoose/schema"

type reimbursement = {
  recipientWalletId: string
  amount: number
  memo: string
}

const getRandomInvalidPhone = () => {
  return `+abc${Math.floor(Math.random() * 999_999_999_999_999)}`
}

type generatedWallets = {
  accountId: AccountId
  btcWalletId: WalletId
  usdWalletId: WalletId
  jwtToken: JwtToken
}

const generateWallets = async (count: number, level: AccountLevel) => {
  await setupMongoConnection()
  const wallets: Array<generatedWallets> = []
  for (let i = 0; i < count; i++) {
    const phone = getRandomInvalidPhone() as PhoneNumber
    const account = await User.create({ phone, level })

    const btcWallet = await WalletsRepository().persistNew({
      accountId: account._id,
      type: WalletType.Checking,
      currency: WalletCurrency.Btc,
    })
    if (btcWallet instanceof Error) return btcWallet

    const usdWallet = await WalletsRepository().persistNew({
      accountId: account._id,
      type: WalletType.Checking,
      currency: WalletCurrency.Usd,
    })

    if (usdWallet instanceof Error) return usdWallet

    const network = BTC_NETWORK

    const jwtToken = createToken({ uid: account._id, network })

    await Accounts.updateDefaultWalletId({
      accountId: account._id,
      walletId: usdWallet.id,
    })

    wallets.push({
      accountId: account._id,
      btcWalletId: btcWallet.id,
      usdWalletId: usdWallet.id,
      jwtToken,
    })
  }

  return wallets
}

const main = async () => {
  const args = process.argv
  if (args.length === 6) {
    const numWallets = parseInt(args[2])

    const disburserWalletId = checkedToWalletId(args[3])
    if (disburserWalletId instanceof Error) return disburserWalletId

    const disbursementAmount = checkedToSats(parseInt(args[4]))
    if (disbursementAmount instanceof Error) return disbursementAmount

    const accountLevel = checkedToAccountLevel(parseInt(args[5]))
    if (accountLevel instanceof Error) return accountLevel

    const wallets = await generateWallets(numWallets, accountLevel)
    console.log({ wallets })
  } else {
    console.error("Invalid number of arguments")
  }
}

setupMongoConnection()
  .then(async (mongoose) => {
    await main()
    console.log(mongoose.connection.status)
  })
  .catch((err) => console.log(err))
