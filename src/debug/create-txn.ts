/**
 * how to run:
 * yarn ts-node --files -r tsconfig-paths/register src/debug/create-txn.ts 21000 +786363
 * The first argument is the amount of sats to assign to new funder
 * The second argument is the phone number of the funder account
 */

import { Wallets } from "@app"
import { getCurrentPrice } from "@app/prices/get-current-price"
import { checkedToSats } from "@domain/bitcoin"
import { DisplayCurrencyConverter } from "@domain/fiat/display-currency"
import { WalletCurrency } from "@domain/shared"
import { checkedToPhoneNumber } from "@domain/users"
import { WalletType } from "@domain/wallets"
import { LedgerService } from "@services/ledger"
import { isUp } from "@services/lnd/health"
import { params as unauthParams } from "@services/lnd/unauth"
import { baseLogger } from "@services/logger"
import { setupMongoConnection } from "@services/mongodb"
import {
  AccountsRepository,
  UsersRepository,
  WalletsRepository,
} from "@services/mongoose"

const consolidateFunds = async (sats: Satoshis, phone: PhoneNumber) => {
  await setupMongoConnection()

  const user = await UsersRepository().persistNew({ phone, phoneMetadata: undefined })
  if (user instanceof Error) return user

  const account = await AccountsRepository().findByUserId(user.id)
  if (account instanceof Error) return account

  const wallet = await WalletsRepository().persistNew({
    accountId: account.id,
    type: WalletType.Checking,
    currency: WalletCurrency.Btc,
  })
  if (wallet instanceof Error) return wallet

  account.defaultWalletId = wallet.id
  account.level = 2

  const updateResult = await AccountsRepository().update(account)
  if (updateResult instanceof Error) return updateResult

  const address = await Wallets.createOnChainAddress(wallet.id)
  if (address instanceof Error) return address

  const displayCurrencyPerSat = await getCurrentPrice()
  if (displayCurrencyPerSat instanceof Error) return displayCurrencyPerSat

  const converter = DisplayCurrencyConverter(displayCurrencyPerSat)
  const amountDisplayCurrency = converter.fromSats(sats)
  const feeDisplayCurrency = converter.fromSats(0 as Satoshis)

  const ledger = LedgerService()

  const result = await ledger.addOnChainTxReceive({
    walletId: wallet.id,
    walletCurrency: wallet.currency,
    txHash: "" as OnChainTxHash,
    sats,
    fee: 0 as Satoshis,
    amountDisplayCurrency,
    feeDisplayCurrency,
    receivingAddress: address,
  })
  if (result instanceof Error) {
    baseLogger.error({ error: result }, "Could not record onchain tx in ledger")
    return result
  }

  return { newFunder: { walletId: wallet.id, accountId: account.id } }
}

const main = async () => {
  const args = process.argv
  if (args.length === 4) {
    const sats = parseInt(args[2])
    const checkedSats = checkedToSats(sats)
    if (checkedSats instanceof Error) return checkedSats

    const checkedPhone = checkedToPhoneNumber(args[3])
    if (checkedPhone instanceof Error) return checkedPhone

    return consolidateFunds(checkedSats, checkedPhone)
  }
  console.error("Invalid number of arguments")
  return
}

setupMongoConnection()
  .then(async (mongoose) => {
    await Promise.all(unauthParams.map((lndParams) => isUp(lndParams)))
    console.log(await main())
    return mongoose.connection.close()
  })
  .catch((err) => console.log(err))
