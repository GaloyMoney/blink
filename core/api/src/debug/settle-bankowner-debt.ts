/**
 * how to run:
 *
 * . ./.envrc && yarn ts-node --files -r tsconfig-paths/register src/debug/settle-bankowner-debt.ts <amount>
 *
 * <amount>: amount to deduct from bankowner.
 */

import { getCurrentPriceAsWalletPriceRatio } from "@app/prices"

import { WalletCurrency } from "@domain/shared"
import { UsdDisplayCurrency } from "@domain/fiat"

import { isUp } from "@services/lnd/health"
import { lndsConnect } from "@services/lnd/auth"
import * as LedgerFacade from "@services/ledger/facade"
import { setupMongoConnection } from "@services/mongodb"

const settleDebt = async ({ amount }: { amount: bigint }) => {
  const btcAmount = { amount, currency: WalletCurrency.Btc }

  const walletPriceRatio = await getCurrentPriceAsWalletPriceRatio({
    currency: UsdDisplayCurrency,
  })
  if (walletPriceRatio instanceof Error) return walletPriceRatio

  const usdAmount = walletPriceRatio.convertFromBtc(btcAmount)
  const settled = await LedgerFacade.recordSettleBankownerDebt({
    description: "Settle bankowner debt",
    amount: {
      btc: btcAmount,
      usd: usdAmount,
    },
  })
  return settled
}

const main = async () => {
  const args = process.argv.slice(-1)
  const params = {
    amount: BigInt(args[0]),
  }
  const result = await settleDebt(params)
  if (result instanceof Error) {
    console.error("Error:", result)
    return
  }
  console.log(`Settle complete with ${params.amount} sats`, result)
}

setupMongoConnection()
  .then(async (mongoose) => {
    await Promise.all(lndsConnect.map((lndParams) => isUp(lndParams)))
    await main()
    if (mongoose) await mongoose.connection.close()
  })
  .catch((err) => console.log(err))
