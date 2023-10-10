/**
 * how to run. to update for 3000 sats fees:
 *
 * . ./.envrc && yarn ts-node --files -r tsconfig-paths/register src/debug/update-withdraw-fee-all-accounts.ts 3000
 */

import mongoose from "mongoose"

import { updateAccountWithdrawFee } from "@/app/accounts/update-account-withdraw-fee"
import { setupMongoConnection } from "@/services/mongodb"

import { AccountsRepository } from "@/services/mongoose"

const updateFee = async (fee: number) => {
  await setupMongoConnection()
  console.log("Mongoose connection ready")

  const accounts = AccountsRepository().listUnlockedAccounts()
  if (accounts instanceof Error) return accounts

  for await (const account of accounts) {
    const { id: accountId } = account
    const updateResult = await updateAccountWithdrawFee({ accountId, fee })
    if (updateResult instanceof Error) {
      console.error(`Could not set fee for: ${accountId}`, { updateResult })
      continue
    }
  }

  return mongoose.connection.close()
}

const fee = Number(process.argv[2])
if (typeof fee !== "number") throw new Error("fee is not a number")

updateFee(fee).then(console.log).catch(console.error)
